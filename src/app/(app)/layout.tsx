"use client";

import { WorkspaceProvider } from "@/contexts/workspace-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <TooltipProvider>
        <Sidebar />
        <div className="lg:ml-[260px] h-[100dvh] xl:min-h-screen bg-transparent text-foreground flex flex-col overflow-hidden xl:overflow-visible">
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden xl:overflow-visible pt-14 lg:pt-0">
            <div className="pt-8 pb-4 px-6 sm:px-8 sm:pt-10 lg:p-10 max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden xl:overflow-visible">
              {children}
            </div>
          </main>
        </div>
      </TooltipProvider>
    </WorkspaceProvider>
  );
}
