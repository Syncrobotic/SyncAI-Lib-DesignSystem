// @syncrobotic/robot-icons v0.22.1 · update: npx shadcn add @syncrobotic/robot-icons --overwrite
import { createLucideIcon } from "lucide-react"

/*
  Robot icons Lucide does not have, drawn to its rules: 24 px grid, 2 px stroke, round caps and joins, no fill.
  Built with Lucide's own factory, so they take the same props (size, strokeWidth, className) and sit beside it unnoticed.
*/

/** A robot arm: a cobot or any fixed manipulator. */
export const RobotArm = createLucideIcon("RobotArm", [
  ["path", { d: "M3 21h10", key: "r0" }],
  ["path", { d: "M5 21v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2", key: "r1" }],
  ["circle", { cx: "8", cy: "12", r: "2", key: "r2" }],
  ["path", { d: "M8 14v3", key: "r3" }],
  ["path", { d: "m9.4 10.6 3.2-3.2", key: "r4" }],
  ["circle", { cx: "14", cy: "6", r: "2", key: "r5" }],
  ["path", { d: "M16 6h3a1 1 0 0 1 1 1v2", key: "r6" }],
  ["path", { d: "M18 12V9h4v3", key: "r7" }],
])

/** A mobile robot (AMR) seen from the side: low body, two wheels, the lidar on top. */
export const MobileRobot = createLucideIcon("MobileRobot", [
  ["rect", { x: "2", y: "6", width: "20", height: "8", rx: "2", key: "m0" }],
  ["circle", { cx: "7", cy: "19", r: "2", key: "m1" }],
  ["circle", { cx: "17", cy: "19", r: "2", key: "m2" }],
  ["path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", key: "m3" }],
])

/** The charging dock, with a robot docked against it. Use for the dock and for sending a robot there. */
export const ChargingDock = createLucideIcon("ChargingDock", [
  ["path", { d: "M3 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16", key: "c0" }],
  ["path", { d: "m8 7-2 3h3l-2 3", key: "c1" }],
  ["path", { d: "M11 15h2", key: "c2" }],
  ["rect", { x: "13", y: "12", width: "8", height: "6", rx: "2", key: "c3" }],
  ["path", { d: "M2 21h20", key: "c4" }],
])

/** A physical emergency stop pressed on the machine. Not the on-screen stop: that is the stop button's Square. */
export const EStopPressed = createLucideIcon("EStopPressed", [
  ["path", { d: "M4 21h16", key: "e0" }],
  ["path", { d: "M6 21v-5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5", key: "e1" }],
  ["path", { d: "M5 15c0-2 3-3 7-3s7 1 7 3", key: "e2" }],
  ["path", { d: "M12 3v5", key: "e3" }],
  ["path", { d: "m9 6 3 3 3-3", key: "e4" }],
])

/** A safety zone marked on the floor: no entry or reduced speed. */
export const SafetyZone = createLucideIcon("SafetyZone", [
  ["path", { d: "M5 3a2 2 0 0 0-2 2", key: "s0" }],
  ["path", { d: "M19 3a2 2 0 0 1 2 2", key: "s1" }],
  ["path", { d: "M21 19a2 2 0 0 1-2 2", key: "s2" }],
  ["path", { d: "M5 21a2 2 0 0 1-2-2", key: "s3" }],
  ["path", { d: "M9 3h1", key: "s4" }],
  ["path", { d: "M9 21h1", key: "s5" }],
  ["path", { d: "M14 3h1", key: "s6" }],
  ["path", { d: "M14 21h1", key: "s7" }],
  ["path", { d: "M3 9v1", key: "s8" }],
  ["path", { d: "M21 9v1", key: "s9" }],
  ["path", { d: "M3 14v1", key: "s10" }],
  ["path", { d: "M21 14v1", key: "s11" }],
  ["path", { d: "m8 12 4-4", key: "s12" }],
  ["path", { d: "m8 16 8-8", key: "s13" }],
  ["path", { d: "m12 16 4-4", key: "s14" }],
])

/**
 * A low-priority alarm (Alarm's glyph for low): a diamond with "!", drawn on Lucide's grid (Lucide's Diamond plus CircleAlert's mark). Not a
 * circle: at 20 px a circle and the critical octagon read as the same round outline.
 */
export const DiamondAlert = createLucideIcon("DiamondAlert", [
  ["path", { d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z", key: "da0" }],
  ["path", { d: "M12 8v4", key: "da1" }],
  ["path", { d: "M12 16h.01", key: "da2" }],
])
