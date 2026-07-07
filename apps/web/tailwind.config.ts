import type { Config } from "tailwindcss";

// Design tokens — "clinical calm" direction.
// Deep biological green-black background (not pure black), a mint "vital
// sign" accent used sparingly for the signature waveform + primary actions,
// and a coral used only for streaks/attention states so it stays rare.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1210",      // page background
        surface: "#131E1B",  // card background
        surface2: "#1B2925", // raised card / hover
        vital: "#4CE0B3",    // signature mint accent
        coral: "#FF8A5B",    // streaks / attention
        bone: "#E9F2ED",     // primary text on dark
        muted: "#6B8079",    // secondary text
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { strokeDashoffset: "0" },
          "50%": { strokeDashoffset: "-24" },
        },
      },
      animation: {
        "pulse-line": "pulseLine 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
