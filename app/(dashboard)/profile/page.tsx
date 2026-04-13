"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, MapPin, Phone, Save, KeyRound, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { cn, formatDate } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [farmName, setFarmName] = useState("");

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setEmail(user.email ?? "");

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!prof) { router.push("/login"); return; }

      setProfile(prof);
      setFullName(prof.full_name);
      setPhone(prof.phone ?? "");
      setDistrict(prof.district ?? "");
      setFarmName(prof.farm_name ?? "");
      setLoading(false);
    };
    load();
  }, [router]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        district: district || null,
        farm_name: farmName || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast({ message: "Failed to save profile. Please try again.", variant: "error" });
    } else {
      toast({ message: "Profile updated successfully." });
      setProfile({ ...profile, full_name: fullName, phone: phone || null, district: district || null, farm_name: farmName || null });
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast({ message: "Password must be at least 8 characters.", variant: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ message: "Passwords do not match.", variant: "error" });
      return;
    }

    setChangingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      toast({ message: error.message, variant: "error" });
    } else {
      toast({ message: "Password changed successfully." });
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }

  async function handleSignOutAll() {
    if (!window.confirm("This will sign you out of all devices. Continue?")) return;
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Profile</h1>
        <p className="text-sm text-muted mt-1">Manage your account settings</p>
      </div>

      {/* Account info (read-only) */}
      <div className="card animate-fade-up" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-forest-mid/10 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-forest-mid" />
          </div>
          <h2 className="font-display text-lg font-semibold">Account</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-0.5">Email</div>
            <div className="text-sm font-medium">{email}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-0.5">Role</div>
            <div className="text-sm font-medium capitalize">{profile.role}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-0.5">Member since</div>
            <div className="text-sm font-medium">{formatDate(profile.created_at)}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-0.5">Last login</div>
            <div className="text-sm font-medium">{profile.last_login ? formatDate(profile.last_login, "dd MMM yyyy, HH:mm") : "---"}</div>
          </div>
        </div>
      </div>

      {/* Personal information (editable) */}
      <div className="card animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-forest-mid/10 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-forest-mid" />
          </div>
          <h2 className="font-display text-lg font-semibold">Personal Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="phone"
                  className="input pl-10"
                  placeholder="+267 7X XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="district">District</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="district"
                  className="input pl-10"
                  placeholder="e.g. Southern"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
            </div>
          </div>

          {profile.role === "farmer" && (
            <div>
              <label className="label" htmlFor="farmName">Farm name</label>
              <input
                id="farmName"
                className="input"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save changes</>
            )}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="card animate-fade-up" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-forest-mid/10 flex items-center justify-center">
            <KeyRound className="w-4.5 h-4.5 text-forest-mid" />
          </div>
          <h2 className="font-display text-lg font-semibold">Security</h2>
        </div>

        {!showPassword ? (
          <button
            onClick={() => setShowPassword(true)}
            className="btn-secondary"
          >
            <KeyRound className="w-4 h-4" /> Change password
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="newPass">New password</label>
              <input
                id="newPass"
                type="password"
                className="input"
                minLength={8}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="confirmPass">Confirm new password</label>
              <input
                id="confirmPass"
                type="password"
                className="input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="btn-primary"
              >
                {changingPassword ? "Updating..." : "Update password"}
              </button>
              <button
                onClick={() => { setShowPassword(false); setNewPassword(""); setConfirmPassword(""); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      {profile.role !== "admin" && (
        <div className="card border-red-200 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <LogOut className="w-4.5 h-4.5 text-alert-red" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Danger Zone</h2>
              <p className="text-xs text-muted">Irreversible actions</p>
            </div>
          </div>
          <button
            onClick={handleSignOutAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-alert-red text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out of all devices
          </button>
        </div>
      )}
    </div>
  );
}
