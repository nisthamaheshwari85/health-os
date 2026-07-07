import { Navigation } from "lucide-react";
import type { HealthGPS } from "@/lib/healthGPS";

export function HealthGPSCard({ gps }: { gps: HealthGPS }) {
  return (
    <div className="bg-surface hover-lift rounded-2xl p-6 border border-surface2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-vital" />
          <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
            Health GPS
          </p>
        </div>
        <p className="text-muted text-sm">
          {gps.currentScore} → <span className="text-vital">{gps.targetScore}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {gps.steps.map((step) => (
          <div
            key={step.week}
            className="flex items-center gap-4 bg-surface2 rounded-lg px-4 py-3"
          >
            <div className="font-display text-lg font-semibold text-vital w-16 shrink-0">
              Wk {step.week}
            </div>
            <div className="flex-1">
              <p className="text-bone text-sm font-medium">{step.focus}</p>
              <p className="text-muted text-xs">{step.action}</p>
            </div>
            <div className="font-mono text-sm text-muted shrink-0">
              → {step.targetScoreByWeek}
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted text-xs mt-4">
        A simple 3-week path based on your current lowest inputs — not a
        prediction, just a plan you can adjust as you go.
      </p>
    </div>
  );
}
