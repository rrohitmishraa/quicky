"use client";

import { motion } from "framer-motion";

export default function Modal({ title, children, actions }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl w-80 text-center">
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {children}
        </motion.div>

        {actions && <div className="flex gap-3 justify-center">{actions}</div>}
      </div>
    </div>
  );
}
