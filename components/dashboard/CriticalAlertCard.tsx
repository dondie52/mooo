import { Bell } from "lucide-react";
import Link from "next/link";

interface CriticalAlertCardProps {
  title: string;
  message: string;
  action?: { label: string; href: string };
}

export default function CriticalAlertCard({
  title,
  message,
  action,
}: CriticalAlertCardProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-alert-red/10 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-alert-red" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-alert-red mb-0.5">
          {title}
        </h3>
        <p className="text-sm text-forest-deep/70">{message}</p>
      </div>
      {action && (
        <Link href={action.href} className="btn-primary text-xs shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}
