import type { Streak } from "@health-os/shared";
import { computeLevel } from "@/lib/gamification";

export function GamificationBar({
  xpTotal,
  streak,
}: {
  xpTotal: number;
  streak: Streak | null;
}) {
  const { level, xpIntoLevel, xpPerLevel } = computeLevel(xpTotal);
  const pct = Math.round((xpIntoLevel / xpPerLevel) * 100);

  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface2 flex items-center justify-between gap-6">
      <div className="flex-1">
        <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-2">
          Level {level}
        </p>
        <div className="h-2 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-vital rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-muted text-xs mt-2 font-mono">
          {xpIntoLevel}/{xpPerLevel} XP to next level
        </p>
        <p className="text-muted text-xs mt-1">
          Earn XP by logging vitals, meals, or chatting with your coach.
        </p>
      </div>
      <div className="text-center px-4 border-l border-surface2">
        <p className="font-display text-3xl text-coral">
          {streak?.current_streak ?? 0}
          <span aria-hidden="true"> 🔥</span>
        </p>
        <p className="font-mono text-xs text-muted uppercase tracking-wide">
          day streak
        </p>
      </div>
    </div>
  );
}
