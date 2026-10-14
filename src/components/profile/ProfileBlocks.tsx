import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { cn } from "@/lib/utils";

/*
 * Building blocks shared by the professional and company profiles (Figma "profile"):
 * coloured prompt cards, white cards with info rows, the reviews block and the bottom actions.
 */

const PROMPT_TONES = {
  viola: { card: "bg-viola", label: "text-rosa", answer: "text-white" },
  rosa: { card: "bg-rosa", label: "text-viola", answer: "text-viola" },
  rosso: { card: "bg-rosso", label: "text-white", answer: "text-white" },
  white: { card: "bg-white", label: "text-viola-500", answer: "text-viola" },
} as const;

export type PromptTone = keyof typeof PROMPT_TONES;

/** A coloured block: label 13/16 on top, the answer in the user's own voice (Prompt style). */
export function PromptCard({ tone, label, children }: { tone: PromptTone; label: string; children: React.ReactNode }) {
  const t = PROMPT_TONES[tone];
  return (
    <section className={cn("rounded-card p-6 flex flex-col gap-3.5", t.card)}>
      <h3 className={cn("text-label", t.label)}>{label}</h3>
      <p className={cn("font-prompt text-prompt wrap-break-word whitespace-pre-line", t.answer)}>{children}</p>
    </section>
  );
}

/** White card with a small label on top. */
export function WhiteCard({
  label,
  action,
  children,
  className,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-white p-6 flex flex-col gap-3.5 text-viola", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-label text-viola">{label}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Info row: 24px viola line icon, label 13/16 over value 16/22 medium, viola/15 divider. */
export function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-4 py-3 border-b border-viola/15 last:border-b-0 last:pb-0 first:pt-0">
      <Icon size={24} strokeWidth={1.75} className="mt-1.5 shrink-0 text-viola" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-label text-viola">{label}</div>
        <div className="mt-0.5 text-body font-medium text-viola wrap-break-word">{children}</div>
      </div>
    </li>
  );
}

export function Chip({ children, variant = "rosa" }: { children: React.ReactNode; variant?: "rosa" | "outline" }) {
  return (
    <li
      className={cn(
        "max-w-full rounded-full px-4 py-2 text-chip text-viola wrap-break-word",
        variant === "rosa" ? "bg-rosa" : "bg-white border border-viola/20"
      )}
    >
      {children}
    </li>
  );
}

/** Round icon action: white circle, 1px viola outline. */
export const circleAction =
  "pressable inline-flex shrink-0 items-center justify-center size-14 rounded-full bg-white border border-viola text-viola hover:bg-crema";

/** "Di' helllo!": the wordmark set inside the label of a rosso pill. */
export function SayHelllo() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1.5 text-lg font-bold">
      Di&apos;
      <span className="inline-flex items-center">
        <Logo className="h-6 text-white" title={null} />
        <span className="text-[1.5rem] leading-none">!</span>
      </span>
    </span>
  );
}

interface Review {
  id: string;
  author: { name: string | null; image: string | null } | null;
  stars: number;
  text: string | null;
  createdAt: Date | null;
}

/** Reviews on a coloured page background: summary in white, review cards below. */
export function ProfileReviews({
  title,
  averageRating,
  reviewCount,
  countLabel,
  reviews,
  fallbackAuthor,
  empty,
}: {
  title: string;
  averageRating: string | null;
  reviewCount: number | null;
  countLabel: string;
  reviews: Review[];
  fallbackAuthor: string;
  empty: { title: string; text: string };
}) {
  const rounded = Math.round(Number(averageRating));
  return (
    <section className="mt-10 md:mt-14 space-y-4" aria-labelledby="profile-reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 text-white">
        <h2 id="profile-reviews-title" className="text-title wrap-break-word min-w-0">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex" role="img" aria-label={`${rounded} su 5 stelle`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                aria-hidden
                className={s <= rounded ? "fill-rosa text-rosa" : "text-white/40"}
              />
            ))}
          </div>
          <span className="text-title tabular-nums">{averageRating || "0.0"}</span>
          <span className="text-label text-crema">
            su {reviewCount || 0} {countLabel}
          </span>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              authorName={review.author?.name ?? fallbackAuthor}
              authorImage={review.author?.image ?? undefined}
              stars={review.stars}
              text={review.text}
              createdAt={review.createdAt}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-card bg-white px-6 py-10 text-center">
          <span className="mx-auto mb-4 size-14 rounded-full bg-rosa flex items-center justify-center text-viola">
            <Star size={26} strokeWidth={1.75} aria-hidden />
          </span>
          <h3 className="text-xl font-bold text-viola">{empty.title}</h3>
          <p className="mt-2 text-body text-viola-500 max-w-sm mx-auto">{empty.text}</p>
        </div>
      )}
    </section>
  );
}
