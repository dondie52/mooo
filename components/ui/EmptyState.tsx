import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-12">
      <Icon className="w-10 h-10 text-muted/40 mx-auto mb-3" />
      <p className="text-sm font-medium text-forest-deep">{title}</p>
      <p className="text-xs text-muted mt-1">{description}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-4 inline-flex">
          {action.label}
        </Link>
      )}
    </div>
  );
}
