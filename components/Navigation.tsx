"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, History, LogOut, TrendingUp } from "lucide-react";
import { signOut } from "@/actions/auth";

export default function Navigation({ bankroll }: { bankroll: number }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/bets/new", icon: Plus, label: "New Bet" },
    { href: "/history", icon: History, label: "History" },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="font-bold text-sm">Bet On Yourself</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-zinc-500 leading-none">Bankroll</div>
              <div className={`font-bold text-sm bankroll-number leading-none mt-0.5 ${
                bankroll >= 10000 ? "text-amber-400" : bankroll >= 8000 ? "text-yellow-500" : "text-red-400"
              }`}>
                ${bankroll.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <form action={signOut}>
              <button type="submit" className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 transition-colors ${
                  active ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {href === "/bets/new" ? (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center mb-0.5">
                    <Icon className="w-5 h-5 text-zinc-950" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                {href !== "/bets/new" && (
                  <span className="text-xs font-medium">{label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
