"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from("staff")
        .select("name, role, property_id, properties(name)")
        .eq("user_id", user.id)
        .single();

      if (staffData) {
        setUserName(staffData.name);
        setUserRole(staffData.role as string);
        const initials = staffData.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        setUserInitials(initials);
        const prop = staffData.properties as unknown as { name: string } | null;
        if (prop) {
          setPropertyName(prop.name);
        }
      }
    }
    loadUserData();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const roleLevels: Record<string, number> = { clerk: 1, manager: 2, admin: 3 };
  const level = roleLevels[userRole] || 0;

  const navItems = [
    {
      label: "Packages",
      href: "/dashboard",
      minLevel: 1,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
    },
    {
      label: "Scan",
      href: "/dashboard/scan",
      minLevel: 1,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
      ),
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      minLevel: 2,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      minLevel: 2,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  const visibleNavItems = navItems.filter(item => level >= item.minLevel);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-foreground/5 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-foreground/5 px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-foreground">
            Received
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-purple/10 text-purple font-medium"
                  : "text-text-muted hover:bg-surface-alt hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-foreground/5 p-4">
          {propertyName && (
            <div className="mb-3 rounded-lg bg-surface-alt px-3 py-2">
              <p className="text-xs font-medium text-text-muted">Property</p>
              <p className="truncate text-sm font-medium text-foreground">{propertyName}</p>
            </div>
          )}
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple/10 text-xs font-medium text-purple">
              {userInitials || "??"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{userName || "Loading..."}</p>
              {userRole && <p className="text-[10px] capitalize text-text-muted">{userRole}</p>}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-text-muted/40 transition-colors hover:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-foreground/5 bg-white px-4 md:hidden">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-foreground">
          Received
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple/10 text-xs font-medium text-purple">
            {userInitials || "??"}
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-text-muted/40 transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-foreground/5 bg-white md:hidden">
        {visibleNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive(item.href)
                ? "text-purple"
                : "text-text-muted"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-64">
        <div className="px-4 pb-20 pt-[72px] md:p-8 md:pb-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
