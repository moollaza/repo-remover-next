import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Trash2 className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-lg font-bold text-foreground">Repo Remover</span>
    </div>
  );
}
