"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Database,
  FileText,
  Download,
  Plus,
  ArrowRight,
  Clock,
  Building,
  CheckCircle,
  AlertTriangle,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import sampleScenarios from "@/data/sample-scenarios.json";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const res = await fetch("/api/assessments");
        const data = await res.json();
        if (data.success && data.assessments) {
          setAssessments(data.assessments);
        }
      } catch (err) {
        console.warn("Failed to fetch assessments:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessments();
  }, []);

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center text-slate-500">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* User Welcome Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Link href="/profile" className="relative group block">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold">
              Edit
            </div>
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {user?.name || "Evaluator"}
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                {user?.role?.replace(/_/g, " ") || "Enterprise Buyer"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user?.email} &middot; {user?.company || "LakehouseFit AI Workspace"} 
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/profile"
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            <User className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            <span>Profile &amp; Photo</span>
          </Link>

          <Link
            href="/assessment"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Evaluations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your Evaluated Assessments &amp; Reports
            </h2>
            <p className="text-xs text-slate-500">
              Evaluations stored in MongoDB Atlas with instant PDF exports.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading assessments...
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <Database className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No assessments created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first assessment or test one of the preloaded evaluation scenarios.
            </p>
            <Link
              href="/assessment"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary"
            >
              Start First Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assessments.map(asm => (
              <div
                key={asm.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {asm.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {asm.organization?.companyName || "Enterprise Evaluation"}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Industry: <strong>{asm.organization?.industry || "Enterprise"}</strong> &middot; {asm.requirementsCount || 4} criteria
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-1 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(asm.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/assessment/results/${asm.id}`}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center"
                  >
                    <span>View Results</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>

                  <a
                    href={`/api/assessments/${asm.id}/report`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-configured Demo Scenarios Quick Links */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-base font-bold">Predefined Hackathon Scenarios</h3>
          <p className="text-xs text-slate-400">
            Click any scenario to test deterministic capability matching and evidence verification.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sampleScenarios.map(s => (
            <Link
              key={s.id}
              href={`/assessment/results/${s.id}`}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-xs block"
            >
              <div className="font-bold text-emerald-400 uppercase text-[10px]">{s.id}</div>
              <div className="text-slate-200 font-semibold truncate mt-0.5">{s.name.split(":")[1]?.trim() || s.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

