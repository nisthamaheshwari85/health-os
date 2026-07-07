/**
 * The app's signature element: an ECG/pulse-style waveform.
 * Used both as a structural section divider and, animated, as the stroke
 * on the Health Score card — it's a literal reference to health monitoring
 * used as a functional UI device, not a decorative flourish.
 */
export function VitalLine({
  className = "",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 400 40"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 20 H140 L155 20 L165 4 L178 36 L190 20 L200 20 L210 12 L220 28 L230 20 H400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animated ? "6 4" : undefined}
        className={animated ? "animate-pulse-line" : ""}
      />
    </svg>
  );
}
