import { cn } from "@/lib/utils";

const TypingIndicator = ({ storeName }: { storeName?: string }) => {
  return (
    <div className="flex justify-start mb-1">
      <div
        className={cn(
          "relative max-w-[75%] rounded-lg shadow-sm px-3 py-2",
          "bg-card text-foreground rounded-tl-none"
        )}
      >
        {/* Tail */}
        <div
          className="absolute top-0 -left-1.5 w-3 h-3 bg-card"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        />
        <div className="flex items-center gap-1">
          <div className="flex gap-[3px] items-center h-5">
            <span className="w-[6px] h-[6px] rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
            <span className="w-[6px] h-[6px] rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
            <span className="w-[6px] h-[6px] rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
