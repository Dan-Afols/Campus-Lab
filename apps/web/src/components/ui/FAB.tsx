import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function FAB() {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed z-40">
      <Link
        to="/ai"
        className="grid h-14 w-14 place-items-center rounded-full text-white shadow-level-4"
        style={{
          background: "var(--gradient-ai)",
          right: "16px",
          bottom: "calc(72px + 16px + env(safe-area-inset-bottom))",
          position: "fixed"
        }}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Link>
    </motion.div>
  );
}
