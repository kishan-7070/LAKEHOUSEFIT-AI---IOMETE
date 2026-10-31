"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function ProfileContent() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile, logout } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("it_decision_maker");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?redirect=/profile");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCompany(user.company || "");
      setRole(user.role || "it_decision_maker");
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage("Image file must be under 4MB.");
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const result = await updateProfile({
      name: name.trim(),
      company: company.trim(),
      role,
      avatar,
    });

    setIsSaving(false);

    if (result.success) {
      setSuccessMessage("Your profile and photo have been updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(result.error || "Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
    router.refresh();
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top back & actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Workspace</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            href="/assessment"
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-primary hover:bg-brand-900 shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-300" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover banner */}
        <div className="h-28 bg-gradient-to-r from-brand-primary via-emerald-800 to-slate-900 relative">
          <div className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30 uppercase tracking-wider">
            Enterprise Evaluator
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-0 relative space-y-6">
          {/* Avatar and Identity */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14">
            <div className="flex items-end space-x-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md border border-slate-200 overflow-hidden">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-extrabold text-3xl">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>

                {/* Camera upload overlay icon */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                  className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-0.5 pb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{name || "Evaluator"}</h1>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="pt-1">
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    {role.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 sm:pt-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 mr-1 text-slate-600" />
                <span>Change Photo</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Work Email <span className="text-slate-400 font-normal">(Account identifier)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Role / Persona</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="it_decision_maker">IT Director / CIO / VP Engineering</option>
                  <option value="data_engineering_lead">Data Engineering Lead / Platform Architect</option>
                  <option value="enterprise_buyer">Enterprise Buyer / Evaluator</option>
                  <option value="security_officer">CISO / Compliance Officer</option>
                  <option value="sales_representative">Solutions Consultant / Sales Prep</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Company / Organization</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full text-sm rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                All changes sync across your workspace and report exports.
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Session / Logout Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Sign Out of LakehouseFit AI</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            End your current session on this device. Your assessments and reports remain safely stored.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-24 text-center text-slate-400">Loading Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

