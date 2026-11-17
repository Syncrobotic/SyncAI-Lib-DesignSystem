"use client"

import * as m from "motion/react-m"
import { patterns } from "./motion"

/** Arrival of a page or section: the one state change every navigation has. Children with `appear` stagger in order. */
export function Appear({ children, className, stagger = 0 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  return (
    <m.div className={className} initial="hidden" animate="shown" variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}>
      {children}
    </m.div>
  )
}

/** One staggered child of Appear. */
export function AppearItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={patterns.appear}>
      {children}
    </m.div>
  )
}

/**
 * A section further down arrives when it scrolls into view: the same appear movement and stagger as the hero, once.
 * Without it only the first screen moves, and the page reads as two different products.
 */
export function Reveal({ children, className, stagger = 0.04 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </m.div>
  )
}
