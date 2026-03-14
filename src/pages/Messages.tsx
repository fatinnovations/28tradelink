import { MessageSquare } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessages";
import { useTranslation } from "react-i18next";
import ConversationList from "@/components/Messages/ConversationList";
import ChatView from "@/components/Messages/ChatView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Messages = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConvKey, setSelectedConvKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Deep-link params from "Chat with Seller" buttons
  const deepLinkStoreId = searchParams.get("storeId");
  const deepLinkSellerId = searchParams.get("sellerId");

  const { data: conversations = [], isLoading: loadingConvos } = useConversations();

  // Handle deep link: auto-select or create conversation with seller
  useEffect(() => {
    if (!user || !deepLinkSellerId || !deepLinkStoreId) return;

    // Don't chat with yourself
    if (deepLinkSellerId === user.id) return;

    const convKey = `${deepLinkSellerId}-${deepLinkStoreId}`;

    // Check if conversation already exists
    const existing = conversations.find((c) => c.oderId === convKey);
    if (existing) {
      setSelectedConvKey(convKey);
      if (isMobile) setShowChat(true);
      // Clear params
      setSearchParams({}, { replace: true });
      return;
    }

    // If conversations loaded and no match, create a virtual entry by selecting this key
    // The conversation will appear once the first message is sent
    if (!loadingConvos) {
      // Fetch store info for display
      supabase
        .from("stores")
        .select("id, name, logo")
        .eq("id", deepLinkStoreId)
        .single()
        .then(({ data: store }) => {
          if (store) {
            setVirtualConv({
              oderId: convKey,
              storeId: deepLinkStoreId,
              storeName: store.name,
              storeLogo: store.logo,
              otherUserId: deepLinkSellerId,
              lastMessage: "",
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
            });
            setSelectedConvKey(convKey);
            if (isMobile) setShowChat(true);
          }
        });
      setSearchParams({}, { replace: true });
    }
  }, [user, deepLinkSellerId, deepLinkStoreId, conversations, loadingConvos, isMobile, setSearchParams]);

  // Virtual conversation for new chats (not yet in DB)
  const [virtualConv, setVirtualConv] = useState<typeof conversations[number] | null>(null);

  const allConversations = virtualConv
    ? conversations.some((c) => c.oderId === virtualConv.oderId)
      ? conversations
      : [virtualConv, ...conversations]
    : conversations;

  const selectedConv = allConversations.find((c) => c.oderId === selectedConvKey) || null;

  const { data: messages = [], isLoading: loadingMessages } = useConversationMessages(
    selectedConv?.otherUserId || null,
    selectedConv?.storeId || null
  );

  const sendMessage = useSendMessage();

  useEffect(() => {
    if (!selectedConvKey && allConversations.length > 0 && !deepLinkSellerId) {
      setSelectedConvKey(allConversations[0].oderId);
    }
  }, [allConversations, selectedConvKey, deepLinkSellerId]);

  const handleSelectConv = (key: string) => {
    setSelectedConvKey(key);
    if (isMobile) setShowChat(true);
  };

  const handleSend = (content: string, mediaUrl?: string, mediaType?: string, replyToId?: string) => {
    if (!selectedConv) return;
    if (!content && !mediaUrl) return;
    sendMessage.mutate({
      receiverId: selectedConv.otherUserId,
      content: content || "",
      storeId: selectedConv.storeId || undefined,
      mediaUrl,
      mediaType,
      replyToId,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("signInToViewMessages")}</h2>
          <p className="text-muted-foreground">{t("needToBeLoggedIn")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-4 md:py-6">
        <div
          className="bg-card rounded-xl shadow-sm overflow-hidden border border-border"
          style={{ height: "calc(100vh - 180px)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-full">
            <div className={`border-r border-border ${isMobile && showChat ? "hidden" : ""}`}>
              <ConversationList
                conversations={allConversations}
                isLoading={loadingConvos}
                selectedKey={selectedConvKey}
                onSelect={handleSelectConv}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            <div className={`${isMobile && !showChat ? "hidden" : "flex flex-col"}`}>
              <ChatView
                conversation={selectedConv}
                messages={messages}
                isLoading={loadingMessages}
                userId={user.id}
                onSend={handleSend}
                isSending={sendMessage.isPending}
                onBack={isMobile ? () => setShowChat(false) : undefined}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
