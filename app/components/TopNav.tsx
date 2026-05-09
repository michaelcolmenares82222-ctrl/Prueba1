"use client";

/**
 * Top-level sticky navigation shared by every route. Marked as a client
 * component because it relies on `usePathname` to highlight the active link.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Hammer, LayoutGrid, Wand2, Home } from "lucide-react";
import type { ReactNode } from "react";

interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
}

const LINKS: NavLink[] = [
  { href: "/", label: "Asistente", icon: <Home className="h-3.5 w-3.5" /> },
  {
    href: "/morphic",
    label: "UI Morfológica",
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
  },
  {
    href: "/app-builder",
    label: "App Builder",
    icon: <Hammer className="h-3.5 w-3.5" />,
  },
  {
    href: "/demo",
    label: "Demo",
    icon: <Wand2 className="h-3.5 w-3.5" />,
  },
];

function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 transition hover:opacity-80 dark:text-slate-100"
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/25"
            aria-hidden="true"
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Universal AI Assistant</span>
          <span className="sm:hidden">UAA</span>
        </Link>

        <ul className="flex items-center gap-1" role="list">
          {LINKS.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    (active
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100")
                  }
                >
                  <span aria-hidden="true">{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

export default TopNav;
