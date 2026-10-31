"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Database,
  BookOpen,
  User,
  LogIn,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthPage = pathname?.startsWith("/auth");

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Tagline */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-sm group-hover:bg-brand-900 transition-colors">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">
                    LakehouseFit<span className="text-emerald-700">.ai</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    IOMETE Track
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium hidden sm:block">
                  Evidence-backed decision support
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link href="/#how-it-works" className="hover:text-emerald-700 transition-colors">
              How It Works
            </Link>
            <Link href="/#sample-scenarios" className="hover:text-emerald-700 transition-colors">
              Test Scenarios
            </Link>
            <Link href="/#knowledge-base" className="hover:text-emerald-700 transition-colors flex items-center space-x-1">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Knowledge Base</span>
            </Link>
            {user && (
              <Link href="/dashboard" className="hover:text-emerald-700 transition-colors flex items-center space-x-1 font-semibold text-emerald-800">
                <LayoutDashboard className="w-4 h-4" />
                <span>My Workspace</span>
              </Link>
            )}
          </nav>

          {/* Action CTAs & Auth Controls */}
          <div className="flex items-center space-x-3">
            {/* If on auth pages (/auth/login, /auth/register), show clean Back link */}
            {isAuthPage ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Back to Overview
                </Link>
              </div>
            ) : user ? (
              /* Authenticated User View: Profile Dropdown + New Assessment */
              <div className="flex items-center space-x-3">
                {/* Profile Dropdown Container */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(prev => !prev)}
                    className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {/* User Avatar */}
                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                      )}
                    </div>

                    <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Header info */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            {user.role?.replace(/_/g, " ") || "Evaluator"}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown navigation items */}
                      <div className="py-1 text-xs text-slate-700">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>Profile &amp; Photo</span>
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>My Workspace</span>
                        </Link>
                        <Link
                          href="/assessment"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          <span>New Assessment</span>
                        </Link>
                      </div>

                      {/* Sign Out inside dropdown */}
                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <Link
                  href="/assessment"
                  className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-brand-primary hover:bg-brand-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-emerald-300" />
                  <span>New Assessment</span>
                </Link>
              </div>
            ) : (
              /* Unauthenticated View: Register + Login */
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href="/auth/register"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors hidden sm:inline-block"
                >
                  Register
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-brand-primary hover:bg-brand-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                  <span>Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
