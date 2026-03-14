import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, Camera, X, Image, Video, Loader2, Mic, Square, Trash2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUploadMessageMedia } from "@/hooks/useMessages";
import type { Message } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: string) => void;
  disabled?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

const ChatInput = ({ onSend, disabled, onTyping, onStopTyping, replyTo, onCancelReply }: ChatInputProps) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [mediaPreview, setMediaPreview] = useState<{
    url: string;
    type: string;
    file: File;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadMedia = useUploadMessageMedia();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Focus input when replying
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      alert("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") { resolve(null); return; }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const ext = mimeType.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setIsRecording(false);
        setRecordingDuration(0);
        resolve(file);
      };
      recorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    chunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const handleSendVoice = useCallback(async () => {
    const file = await stopRecording();
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadMedia.mutateAsync(file);
      onSend("", result.url, result.type);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
    setIsUploading(false);
  }, [stopRecording, uploadMedia, onSend]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview({ url: previewUrl, type: file.type, file });
    e.target.value = "";
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); }
  };

  const handleSend = async () => {
    if ((!message.trim() && !mediaPreview) || disabled) return;
    let mediaUrl: string | undefined;
    let mediaType: string | undefined;
    if (mediaPreview) {
      setIsUploading(true);
      try {
        const result = await uploadMedia.mutateAsync(mediaPreview.file);
        mediaUrl = result.url;
        mediaType = result.type;
        URL.revokeObjectURL(mediaPreview.url);
        setMediaPreview(null);
      } catch (err: any) {
        alert(err.message || "Upload failed");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    onSend(message.trim() || (mediaUrl ? "" : ""), mediaUrl, mediaType);
    setMessage("");
    onStopTyping?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const openFilePicker = (accept: string) => {
    if (fileInputRef.current) { fileInputRef.current.accept = accept; fileInputRef.current.click(); }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const isImage = mediaPreview?.type.startsWith("image");
  const isVideo = mediaPreview?.type.startsWith("video");
  const hasTextOrMedia = message.trim() || mediaPreview;

  if (isRecording) {
    return (
      <div className="bg-card border-t">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={cancelRecording}
            className="shrink-0 rounded-full h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-foreground">{formatDuration(recordingDuration)}</span>
            <div className="flex items-center gap-[2px] flex-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-[2px] bg-destructive/60 rounded-full animate-pulse"
                  style={{ height: `${Math.random() * 20 + 4}px`, animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          </div>
          <Button onClick={handleSendVoice} disabled={isUploading} size="icon"
            className="shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-t">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="flex-1 bg-muted/60 rounded-lg px-3 py-2 border-l-3 border-primary">
            <div className="flex items-center gap-1 mb-0.5">
              <Reply className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-medium text-primary">Reply</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.mediaUrl
                ? replyTo.mediaType?.startsWith("image") ? "📷 Photo"
                  : replyTo.mediaType?.startsWith("video") ? "🎥 Video"
                  : "🎵 Audio"
                : replyTo.content}
            </p>
          </div>
          <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-3 pt-3">
          <div className="relative inline-block rounded-lg overflow-hidden border border-border bg-muted">
            {isImage && <img src={mediaPreview.url} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />}
            {isVideo && (
              <div className="h-20 w-20 flex items-center justify-center bg-muted rounded-lg">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <button onClick={handleRemoveMedia}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"
              className="shrink-0 rounded-full h-10 w-10 text-muted-foreground hover:text-foreground">
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => openFilePicker("image/*")}>
              <Image className="w-4 h-4 mr-2 text-blue-500" />
              {t("photo") || "Photo"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openFilePicker("video/*")}>
              <Video className="w-4 h-4 mr-2 text-purple-500" />
              {t("video") || "Video"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openFilePicker("image/*")} className="md:hidden">
              <Camera className="w-4 h-4 mr-2 text-green-500" />
              {t("camera") || "Camera"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) onTyping?.(); }}
          onKeyDown={handleKeyDown}
          placeholder={t("typeMessage") || "Type a message"}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-2xl bg-muted border-0 px-4 py-2.5 text-sm"
          rows={1}
        />

        {hasTextOrMedia ? (
          <Button onClick={handleSend} disabled={disabled || isUploading} size="icon"
            className="shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        ) : (
          <Button onClick={startRecording} disabled={disabled} size="icon"
            className="shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90">
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

export default ChatInput;
