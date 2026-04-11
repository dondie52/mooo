import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          {title}
        </h1>
        <p className="text-sm text-muted mt-1">{description}</p>
      </div>
      {action && (
        <Link href={action.href} className="btn-primary shrink-0">
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Link>
      )}
    </div>
  );
}
