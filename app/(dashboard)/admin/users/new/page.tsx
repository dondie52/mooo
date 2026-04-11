import { UserPlus } from "lucide-react";

export default function AdminNewUserPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center py-16">
        <UserPlus className="w-10 h-10 text-muted mx-auto mb-4" />
        <h1 className="font-display text-2xl font-semibold text-forest-deep mb-2">
          Add New User
        </h1>
        <p className="text-sm text-muted">
          User creation form coming soon. You will be able to create farmer and
          vet accounts here.
        </p>
      </div>
    </div>
  );
}
