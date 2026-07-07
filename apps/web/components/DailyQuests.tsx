import Link from "next/link";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";

export interface Quest {
  label: string;
  done: boolean;
  href: string;
  xp: number;
}

export function DailyQuests({ quests }: { quests: Quest[] }) {
  return (
    <div className="bg-surface hover-lift rounded-2xl p-6 border border-surface2">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-4 h-4 text-vital" />
        <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
          Today's quests
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {quests.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition ${
              q.done
                ? "border-vital/40 bg-vital/10"
                : "border-surface2 hover:border-vital/50"
            }`}
          >
            {q.done ? (
              <CheckCircle2 className="w-4 h-4 text-vital shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted shrink-0" />
            )}
            <span className={`flex-1 ${q.done ? "text-vital" : "text-bone"}`}>{q.label}</span>
            <span className="text-sm font-mono text-muted">
              {q.done ? "done" : `+${q.xp} XP`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
