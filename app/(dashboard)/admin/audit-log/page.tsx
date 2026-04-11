import { ScrollText } from "lucide-react";

export default function AdminAuditLogPage() {
  return (
    <div>
      <div className="card text-center py-16">
        <ScrollText className="w-10 h-10 text-muted mx-auto mb-4" />
        <h1 className="font-display text-2xl font-semibold text-forest-deep mb-2">
          Audit Log
        </h1>
        <p className="text-sm text-muted">
          Full audit log viewer coming soon. You will be able to search and
          filter all system activity here.
        </p>
      </div>
    </div>
  );
}
