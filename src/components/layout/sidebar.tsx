"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
  ChevronDown,
  MessageSquareText,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Painel de Produção", icon: LayoutDashboard },
  { href: "/prompts", label: "Prompts", icon: MessageSquareText },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, workspace } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.05]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/30">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white tracking-tight truncate">
            Content Flow
          </span>
          <span className="text-[11px] text-zinc-500 truncate">
            {workspace?.name || "Workspace"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                active
                  ? "bg-[#181822] text-white border border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                active 
                  ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
                  : "bg-white/[0.04] text-zinc-400 group-hover:bg-white/[0.08] group-hover:text-white"
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.05] p-3.5">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer outline-none border border-transparent hover:border-white/[0.06]">
              <Avatar className="w-8 h-8 bg-[#181822] border border-white/[0.08]">
                <AvatarFallback className="bg-[#181822] text-xs text-zinc-300 font-semibold">
                  {getInitials(profile?.full_name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate w-full text-left">
                  {profile?.full_name || "Usuário"}
                </span>
                <span className="text-[10px] text-zinc-500 truncate w-full text-left">
                  {profile?.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[#14141B] border-white/10 shadow-2xl rounded-xl p-1"
          >
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-xs text-zinc-300 focus:text-white focus:bg-white/[0.06] rounded-lg cursor-pointer py-2"
            >
              <Settings className="w-3.5 h-3.5 mr-2 text-indigo-400" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-lg cursor-pointer py-2"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[#07070A]/95 backdrop-blur-2xl border-r border-white/[0.05] fixed left-0 top-0 z-40">
        {navContent}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#07070A]/95 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-sm font-bold text-white">Content Flow</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
        >
          {mobileOpen ? (
            <X className="w-4 h-4 text-zinc-400" />
          ) : (
            <Menu className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#07070A] border-r border-white/[0.05] z-50 flex flex-col animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}

