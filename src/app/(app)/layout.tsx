import { WorkspaceProvider } from "@/contexts/workspace-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-transparent text-foreground">
          <main className="min-h-screen">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </TooltipProvider>
    </WorkspaceProvider>
  );
}

