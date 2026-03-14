import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseTypingIndicatorOptions {
  userId: string;
  otherUserId: string | null;
  storeId: string | null;
}

export const useTypingIndicator = ({ userId, otherUserId, storeId }: UseTypingIndicatorOptions) => {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);

  const channelName = otherUserId
    ? `typing-${[userId, otherUserId].sort().join("-")}-${storeId || "dm"}`
    : null;

  // Subscribe to typing events from the other user
  useEffect(() => {
    if (!channelName || !otherUserId) return;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === otherUserId) {
          setIsOtherTyping(true);

          // Clear previous timeout
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

          // Auto-hide after 3 seconds of no typing events
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3000);
        }
      })
      .on("broadcast", { event: "stop_typing" }, (payload) => {
        if (payload.payload?.userId === otherUserId) {
          setIsOtherTyping(false);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, otherUserId]);

  // Send typing event (throttled to every 2 seconds)
  const sendTyping = useCallback(() => {
    if (!channelRef.current) return;

    const now = Date.now();
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    });

    // Schedule stop_typing if no more typing events
    if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
    sendTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "stop_typing",
        payload: { userId },
      });
    }, 3000);
  }, [userId]);

  // Send stop typing immediately (e.g., on message send)
  const sendStopTyping = useCallback(() => {
    if (!channelRef.current) return;
    if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
    lastSentRef.current = 0;

    channelRef.current.send({
      type: "broadcast",
      event: "stop_typing",
      payload: { userId },
    });
  }, [userId]);

  return { isOtherTyping, sendTyping, sendStopTyping };
};
