import { Activity } from "lucide-react";
import type { HealthScoreBreakdown } from "@health-os/shared";
import { VitalLine } from "./VitalLine";

export function HealthScoreCard({ breakdown }: { breakdown: HealthScoreBreakdown }) {
  return (
    <div className="bg-surface hover-lift rounded-2xl p-8 border border-surface2">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-vital" />
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
              Today's Health Score
            </p>
          </div>
          <p className="font-display text-6xl font-bold text-bone">
            {breakdown.score}
            <span className="text-2xl text-muted font-normal">/100</span>
          </p>
          <p className="text-muted text-xs mt-2">
            Combines the 5 bars below — log data to move it.
          </p>
        </div>
      </div>

      <div className="text-vital my-6">
        <VitalLine className="w-full h-10" animated />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {breakdown.drivers.map((d) => (
          <div key={d.label}>
            <p className="font-mono text-xs text-muted uppercase tracking-wide">{d.label}</p>
            <div className="h-1.5 bg-surface2 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-vital rounded-full transition-all"
                style={{ width: `${Math.round(d.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
