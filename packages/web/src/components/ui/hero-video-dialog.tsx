"use client"

import { useState } from "react"
import { Expand, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HeroVideoDialogProps {
  src: string
  alt?: string
  className?: string
}

export function HeroVideoDialog({
  src,
  alt = "Walkthrough",
  className,
}: HeroVideoDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Inline GIF with expand button */}
      <div className={cn("group relative w-full cursor-zoom-in overflow-hidden rounded-sm border border-white/[0.08]", className)}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Expand walkthrough"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(true) }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full transition-all duration-300 ease-out group-hover:brightness-75 group-hover:scale-[1.01]"
        />
        {/* Expand hint */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-sm bg-black/60 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white/70 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <Expand className="size-3" />
          Expand
        </div>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 w-full max-w-5xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute -top-11 right-0 flex items-center gap-1.5 rounded-sm bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white/70 backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all"
              >
                <XIcon className="size-3" />
                Close
              </button>
              <img
                src={src}
                alt={alt}
                className="w-full rounded-sm border border-white/10 shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
