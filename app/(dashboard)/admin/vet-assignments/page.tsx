import Link from "next/link";
import { Link2 } from "lucide-react";

export default function AdminVetAssignmentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest-deep">
            Vet Assignments
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage vet-to-farmer assignments across the system
          </p>
        </div>
        <Link
          href="/admin/vet-assignments/new"
          className="btn-primary flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          Assign Vet
        </Link>
      </div>
      <div className="card text-center py-16">
        <Link2 className="w-10 h-10 text-muted mx-auto mb-4" />
        <p className="text-sm text-muted">
          Vet assignments list coming soon.
        </p>
      </div>
    </div>
  );
}
