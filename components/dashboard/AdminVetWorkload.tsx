"use client";

export type VetWorkloadRow = {
  vet_id: string;
  full_name: string;
  farmer_count: number;
  animal_count: number;
};

interface AdminVetWorkloadProps {
  vets: VetWorkloadRow[];
}

export default function AdminVetWorkload({ vets }: AdminVetWorkloadProps) {
  const maxAnimals = Math.max(...vets.map((v) => v.animal_count), 1);

  return (
    <div className="card h-full">
      <h2 className="font-display text-lg font-semibold text-forest-deep mb-4">
        Vet Workload
      </h2>
      {vets.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">
          No vets registered yet. Click &ldquo;Add User&rdquo; to create a vet
          account.
        </p>
      ) : (
        <div className="space-y-4">
          {vets.map((v) => {
            const barPct = Math.round((v.animal_count / maxAnimals) * 100);
            return (
              <div key={v.vet_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-forest-deep">
                    {v.full_name}
                  </span>
                  <span className="text-xs text-muted">
                    {v.farmer_count} farmer{v.farmer_count !== 1 ? "s" : ""} &middot;{" "}
                    {v.animal_count} animal{v.animal_count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 bg-earth-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-accent rounded-full transition-all"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
