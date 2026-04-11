import { Link2 } from "lucide-react";

export default function AdminNewVetAssignmentPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center py-16">
        <Link2 className="w-10 h-10 text-muted mx-auto mb-4" />
        <h1 className="font-display text-2xl font-semibold text-forest-deep mb-2">
          Assign Vet to Farmer
        </h1>
        <p className="text-sm text-muted">
          Vet assignment form coming soon. You will be able to link veterinary
          officers to farmers for oversight.
        </p>
      </div>
    </div>
  );
}
