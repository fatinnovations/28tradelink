import { Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useMessages";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const ConversationList = ({
  conversations,
  isLoading,
  selectedKey,
  onSelect,
  searchQuery,
  onSearchChange,
}: ConversationListProps) => {
  const { t } = useTranslation();

  const filtered = conversations.filter((c) =>
    c.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-3">{t("messages")}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchMessages") || "Search"}
            className="pl-9 rounded-full bg-muted border-0"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            {t("noConversations")}
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.oderId}
              onClick={() => onSelect(conv.oderId)}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/60 transition-colors text-left border-b border-border/50",
                selectedKey === conv.oderId && "bg-muted"
              )}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {conv.storeLogo ? (
                  <img src={conv.storeLogo} alt={conv.storeName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">{conv.storeName}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[13px] text-muted-foreground truncate">{conv.lastMessage}</p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 min-w-[20px] h-5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
