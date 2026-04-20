import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function ScreenScaffold({
  title,
  description,
  accent,
  children
}: {
  title: string;
  description: string;
  accent?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Card variant="feature" className="border-0 text-white" style={{ background: "var(--gradient-brand)" } as CSSProperties}>
        <h2 className="text-h2">{title}</h2>
        <p className="mt-1 text-body-sm text-white/90">{description}</p>
        {accent ? <div className="mt-3">{accent}</div> : null}
      </Card>
      {children}
    </div>
  );
}
