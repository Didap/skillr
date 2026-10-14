import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/chat/format";
import type { MessageAttachment } from "@/lib/chat/types";

interface ChatAttachmentProps {
  attachment: MessageAttachment;
  mine: boolean;
  /** True only while the message is still being sent. */
  pending: boolean;
  onImageLoad?: () => void;
}

export function ChatAttachment({ attachment, mine, pending, onImageLoad }: ChatAttachmentProps) {
  // No URL yet: uploading while pending, otherwise (e.g. failed) just the file name
  if (!attachment.url) {
    const Icon = pending ? Loader2 : FileText;
    return (
      <span className="flex items-center gap-2 text-sm">
        <Icon
          size={16}
          className={cn("shrink-0", pending && "animate-spin motion-reduce:animate-none")}
          aria-hidden="true"
        />
        <span className="truncate">{attachment.name}</span>
      </span>
    );
  }

  if (attachment.mime.startsWith("image/")) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block -mx-1.5 -mt-0.5">
        {/* Signed Cloudinary URL of unknown size: a plain img, not next/image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={attachment.name} onLoad={onImageLoad} className="max-h-72 w-auto max-w-full rounded-2xl" />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("flex items-center gap-3 rounded-2xl p-3 min-w-0", mine ? "bg-white/15" : "bg-white")}
    >
      <FileText size={24} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{attachment.name}</span>
        <span className="text-label opacity-80">PDF · {formatBytes(attachment.size)}</span>
      </span>
    </a>
  );
}
