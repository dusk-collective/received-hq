import type { Package } from "@/lib/types"

export type EscalationLevel = "none" | "warning" | "orange" | "critical" | "checkout"

export interface EscalationInfo {
  level: EscalationLevel
  label: string
  className: string
  hoursUnclaimed: number
}

export function getEscalation(pkg: Package): EscalationInfo {
  if (pkg.status !== "received" && pkg.status !== "notified") {
    return { level: "none", label: "", className: "", hoursUnclaimed: 0 }
  }

  const now = new Date()
  const received = new Date(pkg.received_at)
  const hoursUnclaimed = (now.getTime() - received.getTime()) / (1000 * 60 * 60)

  // Check checkout today first (highest priority)
  if (pkg.checkout_date) {
    const today = now.toISOString().split("T")[0]
    if (pkg.checkout_date === today) {
      return {
        level: "checkout",
        label: "CHECKOUT TODAY",
        className: "bg-red-600 text-white animate-pulse",
        hoursUnclaimed,
      }
    }
  }

  if (hoursUnclaimed > 72) {
    return {
      level: "critical",
      label: "> 72hrs",
      className: "bg-red-100 text-red-700",
      hoursUnclaimed,
    }
  }

  if (hoursUnclaimed > 48) {
    return {
      level: "orange",
      label: "> 48hrs",
      className: "bg-orange-100 text-orange-700",
      hoursUnclaimed,
    }
  }

  if (hoursUnclaimed > 24) {
    return {
      level: "warning",
      label: "> 24hrs",
      className: "bg-yellow-100 text-yellow-700",
      hoursUnclaimed,
    }
  }

  return { level: "none", label: "", className: "", hoursUnclaimed }
}

export function getAlertCounts(packages: Package[]) {
  const unclaimed = packages.filter(p => p.status === "received" || p.status === "notified")
  const over24 = unclaimed.filter(p => {
    const hours = (Date.now() - new Date(p.received_at).getTime()) / (1000 * 60 * 60)
    return hours > 24
  })
  const over48 = unclaimed.filter(p => {
    const hours = (Date.now() - new Date(p.received_at).getTime()) / (1000 * 60 * 60)
    return hours > 48
  })
  const checkoutToday = unclaimed.filter(p => {
    if (!p.checkout_date) return false
    const today = new Date().toISOString().split("T")[0]
    return p.checkout_date === today
  })

  return { over24: over24.length, over48: over48.length, checkoutToday: checkoutToday.length }
}
