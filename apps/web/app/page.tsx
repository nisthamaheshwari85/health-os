"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Camera,
  Flame,
  MessageCircle,
  Salad,
  Sun,
  TrendingUp,
} from "lucide-react";
import { VitalLine } from "@/components/VitalLine";
import { MagneticButton } from "@/components/MagneticButton";

const FEATURES = [
  {
    icon: Activity,
    title: "Live Health Score",
    body: "One number combining sleep, movement, food, mood, and stress — updates the moment you log anything.",
  },
  {
    icon: MessageCircle,
    title: "AI Coach that remembers",
    body: "Not a generic chatbot — it remembers your goals and preferences, and explains why behind every reply.",
  },
  {
    icon: Camera,
    title: "Snap a photo, done",
    body: "Log meals by typing or photographing your plate — either way it feeds your score automatically.",
  },
  {
    icon: Flame,
    title: "Streaks that stick",
    body: "XP, levels, and daily quests turn showing up into a habit instead of a chore.",
  },
  {
    icon: TrendingUp,
    title: "Health GPS",
    body: "A simple 3-week plan from where you are to where you want to be — no vague advice.",
  },
  {
    icon: Brain,
    title: "Explains every answer",
    body: "Every recommendation names the data behind it and how confident it actually is.",
  },
];

const DAY_FLOW = [
  {
    icon: Sun,
    time: "Morning",
    body: "Open the app, see last night's Health Score, log how you slept.",
  },
  {
    icon: Salad,
    time: "Midday",
    body: "Snap a photo of lunch — it's logged and scored in seconds.",
  },
  {
    icon: MessageCircle,
    time: "Evening",
    body: "Ask the coach a quick question, or just log today's movement.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col overflow-hidden">
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 text-center pt-20 pb-16">
        <div
          className="orb w-72 h-72 bg-vital/30 -top-10 -left-10"
          aria-hidden="true"
        />
        <div
          className="orb w-80 h-80 bg-accent2/25 top-20 right-0"
          style={{ animationDelay: "3s" }}
          aria-hidden="true"
        />

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="relative font-mono text-xs tracking-[0.2em] text-vital uppercase mb-6"
        >
          Your personal AI health operating system
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="relative font-display text-5xl md:text-7xl font-bold tracking-tight text-bone max-w-3xl leading-[1.05]"
        >
          Your AI doctor,<br />
          <span className="gradient-text">nutritionist &amp; coach</span>
          <br />
          in one place.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="relative mt-6 text-muted max-w-xl text-lg"
        >
          Sleep, food, movement, mood — fused into one live Health Score,
          coached by an AI that actually remembers you and explains every
          recommendation.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="relative text-vital w-full max-w-md my-10"
        >
          <VitalLine className="w-full h-8" animated />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="relative gradient-border rounded-full"
        >
          <div className="flex gap-3 bg-surface rounded-full p-1.5">
            <MagneticButton
              href="/signup"
              className="glow-vital block bg-vital text-ink font-body font-semibold px-6 py-3 rounded-full hover:opacity-90 transition"
            >
              Get started free
            </MagneticButton>
            <Link
              href="/login"
              className="text-bone px-6 py-3 rounded-full hover:bg-surface2 transition"
            >
              Log in
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="relative px-6 py-20 border-t border-surface2">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] text-vital uppercase text-center mb-3">
            A day with Health OS
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-bone text-center mb-14">
            This is what actually happens when you use it.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {DAY_FLOW.map((step, i) => (
              <motion.div
                key={step.time}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="bg-surface hover-lift rounded-2xl p-6 border border-surface2 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-vital/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-vital" />
                </div>
                <p className="font-mono text-xs tracking-[0.2em] text-vital uppercase mb-2">
                  {step.time}
                </p>
                <p className="text-muted text-sm leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 border-t border-surface2">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] text-vital uppercase text-center mb-3">
            What's inside
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-bone text-center mb-14">
            Everything a health app should be — nothing it usually is.
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                className="bg-surface hover-lift rounded-2xl p-6 border border-surface2"
              >
                <div className="w-10 h-10 rounded-lg bg-vital/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-vital" />
                </div>
                <h3 className="font-display text-lg font-semibold text-bone mb-2">
                  {f.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 border-t border-surface2 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl md:text-4xl font-bold text-bone mb-4"
        >
          Start your <span className="gradient-text">Health Twin</span> today.
        </motion.h2>
        <p className="text-muted mb-8">Free forever on the core features. Under a minute to set up.</p>
        <MagneticButton
          href="/signup"
          className="glow-vital inline-block bg-vital text-ink font-semibold px-8 py-4 rounded-full hover:opacity-90 transition"
        >
          Get started free
        </MagneticButton>
      </section>

      <footer className="text-center text-muted text-sm py-6 font-mono border-t border-surface2">
        Health OS — built for daily use, not once-a-month check-ins.
      </footer>
    </main>
  );
}
