import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PresenceState {
  isOnline: boolean;
  lastSeen: string | null;
}

export const usePresence = (userId: string | null, otherUserId: string | null) => {
  const [otherUserPresence, setOtherUserPresence] = useState<PresenceState>({
    isOnline: false,
    lastSeen: null,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId || !otherUserId) return;

    const channel = supabase.channel("presence-global", {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherPresence = state[otherUserId];
        if (otherPresence && otherPresence.length > 0) {
          setOtherUserPresence({ isOnline: true, lastSeen: null });
        } else {
          setOtherUserPresence((prev) => ({
            isOnline: false,
            lastSeen: prev.isOnline ? new Date().toISOString() : prev.lastSeen,
          }));
        }
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === otherUserId) {
          setOtherUserPresence({ isOnline: true, lastSeen: null });
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === otherUserId) {
          setOtherUserPresence({ isOnline: false, lastSeen: new Date().toISOString() });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId, otherUserId]);

  return otherUserPresence;
};

export const formatLastSeen = (lastSeen: string | null): string => {
  if (!lastSeen) return "";
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "last seen just now";
  if (diffMins < 60) return `last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  return `last seen ${date.toLocaleDateString()}`;
};
