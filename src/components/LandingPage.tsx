import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gamepad2, LogIn, Sparkles, Trophy, UserPlus, Zap } from "lucide-react";

interface LandingPageProps {
  onSelectAuth: (mode: "login" | "register") => void;
  onNavigate?: (view: string) => void;
}

const layeredGradients = [
  "from-yellow-200 via-yellow-300 to-amber-300",
  "from-yellow-300 via-amber-300 to-orange-300",
  "from-orange-200 via-amber-200 to-yellow-300",
];

const orbitAnimations = [
  { duration: 26, delay: 0 },
  { duration: 32, delay: 4 },
  { duration: 38, delay: 8 },
];

const LandingPage = ({ onSelectAuth, onNavigate }: LandingPageProps) => {
  const floatingEmojis = useMemo(
    () => ["🍌", "🥥", "🌴", "🎮", "🪄", "⚡", "💥", "🛸"].sort(() => 0.5 - Math.random()).slice(0, 4),
    [],
  );
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-[#fff7d4] via-[#ffe29f] to-[#ffc14f]">
      <div className="absolute inset-0">
        {layeredGradients.map((gradient, index) => (
          <motion.div
            key={`orb-${gradient}`}
            className={`absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${gradient} blur-[80px] opacity-40 will-change-transform`}
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: orbitAnimations[index].duration, repeat: Infinity, ease: "linear", delay: orbitAnimations[index].delay }}
          />
        ))}
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.58)_0%,rgba(255,243,205,0.45)_45%,rgba(255,213,122,0.75)_100%)] will-change-[opacity]"
          animate={{ opacity: [0.65, 0.85, 0.65] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {Array.from({ length: 4 }).map((_, index) => (
          <motion.div
            key={`orbit-${index}`}
            className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-[60%] border border-yellow-300/30 will-change-transform"
            style={{ rotate: index * 14 }}
            animate={{
              scale: [1 + index * 0.04, 1.05 + index * 0.04, 1 + index * 0.04],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{ duration: 14 + index * 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.6 }}
          />
        ))}
        {floatingEmojis.map((item, index) => (
          <motion.span
            key={`float-${item}-${index}`}
            className="pointer-events-none absolute select-none text-3xl will-change-transform"
            style={{
              left: `${10 + index * 14}%`,
              top: `${18 + ((index + 1) % 4) * 15}%`,
            }}
            animate={{
              y: [0, -18, 0],
              rotate: index % 2 === 0 ? [0, 6, -6, 0] : [0, -6, 6, 0],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{ duration: 8 + index * 0.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
          >
            {item}
          </motion.span>
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <div className="flex items-center gap-3 rounded-full border border-yellow-200/60 bg-white/80 px-4 py-2 shadow-[0_12px_30px_rgba(255,188,54,0.3)] backdrop-blur-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-amber-400 text-xl shadow-lg shadow-yellow-500/40">
              🍌
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600/80">Banana Brain Blitz</p>
              <p className="text-sm font-semibold text-[#5b3f00]">Arcade Neural Arena</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#8a5d00]/80 md:flex"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          Ultra Reflex Protocol
        </motion.div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24 pt-6 sm:px-12">
        <motion.div
          className="relative grid w-full max-w-6xl items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="relative flex flex-col justify-start gap-8 rounded-[40px] border border-yellow-200/70 bg-white/70 p-10 shadow-[0_40px_120px_-60px_rgba(240,174,0,0.45)] backdrop-blur-md"
          >
            <motion.div className="space-y-8">
              <motion.div className="w-fit rounded-full border border-yellow-300/60 bg-yellow-200/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#704600] shadow-inner">
                Official UoB Puzzle Arena
              </motion.div>
              <h1 className="text-4xl font-black leading-tight text-[#3b2900] sm:text-5xl lg:text-6xl">
                Solve the Banana Brain Challenge in Real Time
              </h1>
              <p className="max-w-xl text-base text-[#6b4c00]/80 sm:text-lg">
                Each round streams a fresh logic puzzle from the official University of Bedfordshire Banana API. Decode the answer,
                chain your combos, and climb the global scoreboard with your squad.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-yellow-200/60 bg-white/80 p-5 text-[#503600] backdrop-blur-xl">
                  <div className="flex items-center gap-3 text-sm font-semibold text-amber-600">
                    <Zap className="h-4 w-4" /> Puzzle-Powered Combos
                  </div>
                  <p className="mt-2 text-xs text-[#7a4f00]/70">Break banana enigmas to trigger streak multipliers.</p>
                </div>
                <div className="rounded-3xl border border-yellow-200/60 bg-white/80 p-5 text-[#503600] backdrop-blur-xl">
                  <div className="flex items-center gap-3 text-sm font-semibold text-rose-500">
                    <Trophy className="h-4 w-4" /> Live Leaderboards
                  </div>
                  <p className="mt-2 text-xs text-[#7a4f00]/70">Sync your scores with the Banana backend instantly.</p>
                </div>
                <div className="rounded-3xl border border-yellow-200/60 bg-white/80 p-5 text-[#503600] backdrop-blur-xl">
                  <div className="flex items-center gap-3 text-sm font-semibold text-sky-600">
                    <Gamepad2 className="h-4 w-4" /> Arcade Precision
                  </div>
                  <p className="mt-2 text-xs text-[#7a4f00]/70">Built for rapid-fire responses across devices.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative flex flex-col justify-start gap-8 rounded-[36px] border border-yellow-200/60 bg-gradient-to-br from-yellow-200/70 via-white/70 to-white/80 p-10 shadow-[0_50px_140px_-70px_rgba(240,174,0,0.45)] backdrop-blur-md"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="absolute -top-24 right-6 h-48 w-48 rounded-full bg-gradient-to-br from-yellow-300/50 via-orange-300/30 to-amber-400/40 blur-[80px]"
              animate={{ scale: [0.8, 1.1, 0.8], rotate: [0, 45, -45, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative space-y-10">
              <div className="text-center">
                <motion.div
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-5xl shadow-[0_18px_35px_rgba(250,204,21,0.35)]"
                  animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  🍌
                </motion.div>
                <h2 className="mt-6 text-3xl font-black text-[#3b2900]">Ready Up, Cadet</h2>
                <p className="mt-2 text-sm text-[#6f4d00]/80">Tap into the verified Banana puzzle feed and play.</p>
              </div>

              <div className="grid gap-4">
                <motion.button
                  type="button"
                  onClick={() => onSelectAuth("login")}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between rounded-3xl border border-yellow-200/60 bg-gradient-to-r from-yellow-200/80 via-yellow-300/80 to-amber-400/80 px-6 py-5 text-left text-[#3b2a00] shadow-[0_24px_40px_-18px_rgba(250,204,21,0.35)] transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6e4b00]/70">Returning Player</p>
                    <p className="mt-2 text-lg font-bold">Log in &amp; keep your solve streak alive</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-lg">
                    <LogIn className="h-7 w-7 text-amber-600" />
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => onSelectAuth("register")}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between rounded-3xl border border-yellow-200/60 bg-gradient-to-r from-orange-200/80 via-rose-300/80 to-pink-400/80 px-6 py-5 text-left text-[#3b2a00] shadow-[0_24px_40px_-18px_rgba(247,149,30,0.35)] transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6e4b00]/70">New Recruit</p>
                    <p className="mt-2 text-lg font-bold">Register to unlock turbo boosts</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-lg">
                    <UserPlus className="h-7 w-7 text-rose-600" />
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-4 pb-10 text-xs uppercase tracking-[0.35em] text-[#a06f00]/70">
        <div className="flex gap-6">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate("contact")}
                className="hover:text-amber-600 transition-colors lowercase tracking-normal"
              >
                Contact Us
              </button>
              <button
                onClick={() => onNavigate("ratings")}
                className="hover:text-amber-600 transition-colors lowercase tracking-normal"
              >
                Ratings
              </button>
              <button
                onClick={() => onNavigate("reviews")}
                className="hover:text-amber-600 transition-colors lowercase tracking-normal"
              >
                Reviews
              </button>
            </>
          )}
        </div>
        <span>Powered by the Banana API Network</span>
        <span className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-amber-500" /> University of Bedfordshire eSports Lab <Sparkles className="h-3 w-3 text-amber-500" />
        </span>
      </footer>
    </div>
  );
};

export default LandingPage;

