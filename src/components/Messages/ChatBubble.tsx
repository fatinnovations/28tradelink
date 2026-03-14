import { useState, useRef, useEffect, useCallback } from "react";
import { Check, CheckCheck, Play, Pause, Mic, Languages, Loader2, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useMessages";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  translatedText?: string;
  isTranslating?: boolean;
  onRequestTranslation?: (messageId: string, text: string, senderLang: string) => void;
  onReply?: (message: Message) => void;
  replyToMessage?: Message | null;
}

const AudioPlayer = ({ src, isOwn }: { src: string; isOwn: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };
    const onTimeUpdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoaded = () => setDuration(audio.duration || 0);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentTime = audioRef.current?.currentTime || 0;

  return (
    <div className="flex items-center gap-2 min-w-[200px] px-1">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlay}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          isOwn ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-foreground"
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-end gap-[2px] h-6 mb-1">
          {Array.from({ length: 28 }).map((_, i) => {
            const h = Math.sin(i * 0.7 + 1) * 0.5 + 0.3 + Math.random() * 0.2;
            const filled = (i / 28) * 100 <= progress;
            return (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-colors",
                  filled
                    ? isOwn ? "bg-primary" : "bg-foreground"
                    : isOwn ? "bg-primary/30" : "bg-muted-foreground/30"
                )}
                style={{ height: `${h * 100}%` }}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </span>
      </div>

      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isOwn ? "bg-primary/10" : "bg-muted"
      )}>
        <Mic className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </div>
  );
};

const ChatBubble = ({ message, isOwn, translatedText, isTranslating, onRequestTranslation, onReply, replyToMessage }: ChatBubbleProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const isDifferentLang = !isOwn && !!message.senderLang && message.senderLang !== currentLang;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isImage = message.mediaType?.startsWith("image");
  const isVideo = message.mediaType?.startsWith("video");
  const isAudio = message.mediaType?.startsWith("audio");
  const hasMedia = !!message.mediaUrl;

  return (
    <>
      <div className={cn("flex mb-1 group", isOwn ? "justify-end" : "justify-start")}>
        {/* Reply button - left side for own messages */}
        {isOwn && onReply && (
          <button
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1 p-1.5 rounded-full hover:bg-muted"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <div
          className={cn(
            "relative max-w-[75%] rounded-lg shadow-sm",
            isAudio ? "px-2 py-2" : hasMedia ? "p-1" : "px-3 py-2",
            isOwn
              ? "bg-[#dcf8c6] dark:bg-emerald-800 text-foreground rounded-tr-none"
              : "bg-card text-foreground rounded-tl-none"
          )}
        >
          {/* Tail */}
          <div
            className={cn(
              "absolute top-0 w-3 h-3",
              isOwn
                ? "-right-1.5 bg-[#dcf8c6] dark:bg-emerald-800"
                : "-left-1.5 bg-card",
            )}
            style={{
              clipPath: isOwn
                ? "polygon(0 0, 100% 0, 0 100%)"
                : "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />

          {/* Reply-to preview */}
          {replyToMessage && (
            <div
              className={cn(
                "mb-1.5 px-2 py-1.5 rounded border-l-3 text-xs cursor-pointer",
                isOwn
                  ? "bg-black/5 dark:bg-black/20 border-primary/60"
                  : "bg-muted/60 border-primary/60"
              )}
            >
              <p className="font-medium text-primary text-[11px] truncate">
                {replyToMessage.senderId === message.senderId ? "You" : "Them"}
              </p>
              <p className="text-muted-foreground truncate">
                {replyToMessage.mediaUrl
                  ? replyToMessage.mediaType?.startsWith("image") ? "📷 Photo"
                    : replyToMessage.mediaType?.startsWith("video") ? "🎥 Video"
                    : "🎵 Audio"
                  : replyToMessage.content}
              </p>
            </div>
          )}

          {/* Audio content */}
          {isAudio && message.mediaUrl && (
            <AudioPlayer src={message.mediaUrl} isOwn={isOwn} />
          )}

          {/* Image/Video content */}
          {hasMedia && !isAudio && (
            <div
              className="cursor-pointer rounded-md overflow-hidden mb-1"
              onClick={() => setMediaOpen(true)}
            >
              {isImage && (
                <img
                  src={message.mediaUrl!}
                  alt="Shared photo"
                  className="max-w-[280px] w-full rounded-md object-cover"
                  loading="lazy"
                />
              )}
              {isVideo && (
                <div className="relative max-w-[280px] w-full">
                  <video
                    src={message.mediaUrl!}
                    className="w-full rounded-md"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div className={cn(hasMedia && "px-2 pb-1")}>
              <p className="text-sm whitespace-pre-wrap">
                {showTranslation && translatedText ? translatedText : message.content}
              </p>
              {isDifferentLang && (
                <div className="flex items-center gap-1 mt-1">
                  {isTranslating ? (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Translating...
                    </span>
                  ) : translatedText ? (
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      <Languages className="w-3 h-3" />
                      {showTranslation ? "Show original" : "See translation"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onRequestTranslation?.(message.id, message.content, message.senderLang!)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                    >
                      <Languages className="w-3 h-3" />
                      Translate
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Time + read status */}
          <div className={cn(
            "flex items-center justify-end gap-1 mt-0.5",
            hasMedia && !message.content && "px-2 pb-1"
          )}>
            <span className="text-[10px] text-muted-foreground">
              {time}
            </span>
            {isOwn && (
              message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <Check className="w-3.5 h-3.5 text-muted-foreground" />
              )
            )}
          </div>
        </div>

        {/* Reply button - right side for received messages */}
        {!isOwn && onReply && (
          <button
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity self-center ml-1 p-1.5 rounded-full hover:bg-muted"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Full-screen media preview */}
      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black border-none">
          {isImage && (
            <img
              src={message.mediaUrl!}
              alt="Full preview"
              className="w-full h-full object-contain"
            />
          )}
          {isVideo && (
            <video
              src={message.mediaUrl!}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBubble;
