import Link from "next/link";

export function TodayPriorities({ priority }: { priority: string }) {
  return (
    <div className="bg-surface rounded-2xl p-8 border border-surface2 flex flex-col justify-between">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-3">
          Today's priority
        </p>
        <p className="font-display text-2xl text-bone leading-snug">{priority}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <Link
          href="/coach"
          className="bg-vital text-ink text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition"
        >
          Ask the coach
        </Link>
        <Link
          href="/nutrition"
          className="border border-surface2 text-bone text-sm px-4 py-2 rounded-full hover:border-vital transition"
        >
          Log a meal
        </Link>
      </div>
    </div>
  );
}
