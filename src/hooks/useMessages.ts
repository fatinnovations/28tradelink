import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "@/i18n";

export interface Conversation {
  oderId: string;
  storeId: string;
  storeName: string;
  storeLogo: string | null;
  otherUserId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  storeId: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  senderLang: string | null;
  replyToId: string | null;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*, stores:store_id(id, name, logo)")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const convMap = new Map<string, Conversation>();

      for (const msg of (messages || []) as any[]) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const key = msg.store_id ? `${otherUserId}-${msg.store_id}` : otherUserId;

        if (!convMap.has(key)) {
          const store = msg.stores as any;
          const lastMsg = msg.media_url
            ? msg.media_type?.startsWith("video") ? "🎥 Video" : "📷 Photo"
            : msg.content;
          convMap.set(key, {
            oderId: key,
            storeId: msg.store_id || "",
            storeName: store?.name || "Direct Message",
            storeLogo: store?.logo || null,
            otherUserId,
            lastMessage: lastMsg,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
          });
        }

        if (msg.receiver_id === user.id && !msg.is_read) {
          const conv = convMap.get(key)!;
          conv.unreadCount += 1;
        }
      }

      return Array.from(convMap.values());
    },
  });
};

export const useConversationMessages = (otherUserId: string | null, storeId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", user?.id, otherUserId, storeId],
    enabled: !!user && !!otherUserId,
    queryFn: async () => {
      if (!user || !otherUserId) return [];

      let q = supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (storeId) {
        q = q.eq("store_id", storeId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        createdAt: m.created_at,
        isRead: m.is_read ?? false,
        storeId: m.store_id,
        mediaUrl: m.media_url || null,
        mediaType: m.media_type || null,
        senderLang: m.sender_lang || null,
        replyToId: m.reply_to_id || null,
      })) as Message[];
    },
  });

  // Mark messages as read
  useEffect(() => {
    if (!user || !otherUserId || !query.data) return;

    const unread = query.data.filter((m) => m.receiverId === user.id && !m.isRead);
    if (unread.length === 0) return;

    supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", unread.map((m) => m.id))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });
  }, [query.data, user, otherUserId, queryClient]);

  // Realtime subscription with optimistic local updates
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`messages-${user.id}-${otherUserId}-${storeId || 'dm'}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (!msg) return;
          const isRelevant =
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id);
          if (storeId && msg.store_id !== storeId) return;
          if (isRelevant) {
            // Optimistically add message to cache
            const queryKey = ["messages", user.id, otherUserId, storeId];
            queryClient.setQueryData(queryKey, (old: Message[] | undefined) => {
              if (!old) return old;
              const newMsg: Message = {
                id: msg.id,
                senderId: msg.sender_id,
                receiverId: msg.receiver_id,
                content: msg.content,
                createdAt: msg.created_at,
                isRead: msg.is_read ?? false,
                storeId: msg.store_id,
                mediaUrl: msg.media_url || null,
                mediaType: msg.media_type || null,
                senderLang: msg.sender_lang || null,
                replyToId: msg.reply_to_id || null,
              };
              // Avoid duplicates
              if (old.some((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (!msg) return;
          const isRelevant =
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id);
          if (isRelevant) {
            const queryKey = ["messages", user.id, otherUserId, storeId];
            queryClient.setQueryData(queryKey, (old: Message[] | undefined) => {
              if (!old) return old;
              return old.map((m) =>
                m.id === msg.id ? { ...m, isRead: msg.is_read ?? m.isRead, content: msg.content } : m
              );
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, storeId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receiverId,
      content,
      storeId,
      mediaUrl,
      mediaType,
      replyToId,
    }: {
      receiverId: string;
      content: string;
      storeId?: string;
      mediaUrl?: string;
      mediaType?: string;
      replyToId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const insertData: any = {
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        store_id: storeId || null,
        sender_lang: i18n.language || "ny",
      };

      if (mediaUrl) insertData.media_url = mediaUrl;
      if (mediaType) insertData.media_type = mediaType;
      if (replyToId) insertData.reply_to_id = replyToId;

      const { error } = await supabase.from("messages").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useUploadMessageMedia = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) throw new Error("File must be less than 25MB");

      const allowedTypes = [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/webm", "video/quicktime",
        "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Only images, videos, and audio files are allowed");
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}/messages/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        type: file.type,
      };
    },
  });
};
