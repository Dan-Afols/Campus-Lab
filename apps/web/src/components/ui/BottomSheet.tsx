import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";

type BottomSheetProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
}>;

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close sheet"
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-white p-4 dark:bg-dark-surface"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0.2 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-mid-gray/40" />
            {title ? <h3 className="mb-3 text-h3">{title}</h3> : null}
            {children}
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
