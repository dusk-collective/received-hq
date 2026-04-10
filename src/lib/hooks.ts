"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Staff, Property } from "@/lib/types"

interface UserContext {
  staff: Staff | null
  property: Property | null
  loading: boolean
}

export function useUserContext(): UserContext {
  const [staff, setStaff] = useState<Staff | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (staffData) {
        setStaff(staffData as Staff)

        const { data: propData } = await supabase
          .from("properties")
          .select("*")
          .eq("id", staffData.property_id)
          .single()

        if (propData) setProperty(propData as Property)
      }
      setLoading(false)
    }
    load()
  }, [])

  return { staff, property, loading }
}

export function canAccess(role: Staff["role"], required: Staff["role"]): boolean {
  const levels: Record<string, number> = { clerk: 1, manager: 2, admin: 3 }
  return (levels[role] || 0) >= (levels[required] || 0)
}
