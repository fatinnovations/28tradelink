import { useRef, useEffect, useState } from "react";
import { ArrowLeft, Store, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import type { Conversation, Message } from "@/hooks/useMessages";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { useTranslateMessage } from "@/hooks/useTranslateMessage";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { usePresence, formatLastSeen } from "@/hooks/usePresence";
import i18n from "@/i18n";

interface ChatViewProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  userId: string;
  onSend: (content: string, mediaUrl?: string, mediaType?: string, replyToId?: string) => void;
  isSending: boolean;
  onBack?: () => void;
}

const DateSeparator = ({ date }: { date: Date }) => {
  let label: string;
  if (isToday(date)) label = "Today";
  else if (isYesterday(date)) label = "Yesterday";
  else label = format(date, "MMM d, yyyy");

  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full shadow-sm">
        {label}
      </span>
    </div>
  );
};

const ChatView = ({
  conversation,
  messages,
  isLoading,
  userId,
  onSend,
  isSending,
  onBack,
}: ChatViewProps) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { translations, loading: translationLoading, translate } = useTranslateMessage();
  const { isOtherTyping, sendTyping, sendStopTyping } = useTypingIndicator({
    userId,
    otherUserId: conversation?.otherUserId || null,
    storeId: conversation?.storeId || null,
  });
  const presence = usePresence(userId, conversation?.otherUserId || null);
  const currentLang = i18n.language;

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Auto-translate incoming messages
  useEffect(() => {
    for (const msg of messages) {
      if (msg.senderId !== userId && msg.content && msg.senderLang && msg.senderLang !== currentLang) {
        translate(msg.id, msg.content, msg.senderLang);
      }
    }
  }, [messages, userId, currentLang, translate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, isOtherTyping]);

  // Build a map of message id -> message for reply lookups
  const messageMap = new Map(messages.map((m) => [m.id, m]));

  const handleSend = (content: string, mediaUrl?: string, mediaType?: string) => {
    onSend(content, mediaUrl, mediaType, replyTo?.id);
    setReplyTo(null);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{t("selectConversation")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("chooseChat")}</p>
        </div>
      </div>
    );
  }

  const presenceText = presence.isOnline
    ? t("online") || "Online"
    : formatLastSeen(presence.lastSeen) || t("offline") || "Offline";

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b shadow-sm">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="relative w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
          {conversation.storeLogo ? (
            <img src={conversation.storeLogo} alt={conversation.storeName} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-5 h-5 text-primary" />
          )}
          {/* Online indicator dot */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
              presence.isOnline ? "bg-green-500" : "bg-muted-foreground/40"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{conversation.storeName}</h3>
          <p className={`text-[11px] ${presence.isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            {isOtherTyping ? "typing..." : presenceText}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-3 py-4" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <Skeleton className="h-14 w-52 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>{t("noMessages")}</p>
            <p className="text-xs mt-1">{t("sendFirstMessage") || "Send a message to start the conversation"}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const msgDate = new Date(msg.createdAt);
            const prevDate = idx > 0 ? new Date(messages[idx - 1].createdAt) : null;
            const showDate = !prevDate || !isSameDay(msgDate, prevDate);
            const replyToMessage = msg.replyToId ? messageMap.get(msg.replyToId) || null : null;

            return (
              <div key={msg.id}>
                {showDate && <DateSeparator date={msgDate} />}
                <ChatBubble
                  message={msg}
                  isOwn={msg.senderId === userId}
                  translatedText={translations[msg.id]}
                  isTranslating={translationLoading[msg.id]}
                  onRequestTranslation={translate}
                  onReply={setReplyTo}
                  replyToMessage={replyToMessage}
                />
              </div>
            );
          })
        )}
        {isOtherTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isSending}
        onTyping={sendTyping}
        onStopTyping={sendStopTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default ChatView;
