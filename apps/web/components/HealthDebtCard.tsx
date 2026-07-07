import { TrendingDown } from "lucide-react";
import type { HealthDebt } from "@/lib/healthDebt";

export function HealthDebtCard({ debt }: { debt: HealthDebt }) {
  if (debt.daysTracked === 0) {
    return (
      <div className="bg-surface hover-lift rounded-2xl p-6 border border-surface2">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-vital" />
          <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
            7-day health debt
          </p>
        </div>
        <p className="text-muted text-sm">
          Log a few days of vitals to see your accumulated sleep debt and stress trend here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface hover-lift rounded-2xl p-6 border border-surface2">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-4 h-4 text-vital" />
        <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
          Last {debt.daysTracked} day{debt.daysTracked === 1 ? "" : "s"} — health debt
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="font-display text-2xl font-bold text-coral">{debt.sleepDebtHours}h</p>
          <p className="font-mono text-xs text-muted uppercase tracking-wide">sleep debt</p>
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-bone">
            {debt.avgStress != null ? debt.avgStress : "—"}
          </p>
          <p className="font-mono text-xs text-muted uppercase tracking-wide">avg stress /10</p>
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-bone">{debt.inactiveDays}</p>
          <p className="font-mono text-xs text-muted uppercase tracking-wide">inactive days</p>
        </div>
      </div>
      <p className="text-muted text-xs mt-4">
        Sleep debt is hours short of 8/night, added up. Inactive days are days under 20
        active minutes. Not a diagnosis — just a running total of what you've already logged.
      </p>
    </div>
  );
}
