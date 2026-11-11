"use client";

import { useState } from "react";
import {
  Users,
  Smartphone,
  Bell,
  CalendarDays,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import StatCard from "@/components/dashboard/StatCard";
import RecentNotifications from "@/components/dashboard/RecentNotifications";
import QuickActions from "@/components/dashboard/QuickActions";

interface DashboardData {
  statistics: {
    participants: number;
    activeDevices: number;
    notifications: number;
    programs: number;
  };
  recentNotifications: {
    title: string;
    body: string;
    type: string;
    created_at: string;
    recipients: number;
  }[];
}

interface DashboardClientProps {
  dashboardData: DashboardData | null;
  error: string | null;
}

export default function DashboardClient({
  dashboardData,
  error,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = dashboardData?.statistics;

  return (
    <div className="min-h-screen">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-[255px]">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-8">
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#087e68]">
                WELCOME BACK
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                Dashboard overview
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Here's what's happening at Rendezvous 2026.
              </p>
            </div>

            <span className="rounded-lg border border-[#e8eeeb] bg-white px-4 py-2 text-xs text-gray-500">
              Live database statistics
            </span>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                Overview
              </h2>
              <span className="text-[10px] text-gray-400">
                MYSQL DATABASE
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total participants"
                value={stats ? stats.participants.toLocaleString() : "—"}
                description="Registered students"
                icon={Users}
              />

              <StatCard
                title="Active devices"
                value={stats ? stats.activeDevices.toLocaleString() : "—"}
                description="Active registered device tokens"
                icon={Smartphone}
              />

              <StatCard
                title="Notifications"
                value={stats ? stats.notifications.toLocaleString() : "—"}
                description="Participant notification records"
                icon={Bell}
              />

              <StatCard
                title="Programs"
                value={stats ? stats.programs.toLocaleString() : "—"}
                description="Total programs"
                icon={CalendarDays}
              />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <RecentNotifications
              notifications={dashboardData?.recentNotifications ?? []}
            />

            <div className="rounded-xl border border-[#e8eeeb] bg-white p-5">
              <h2 className="text-sm font-semibold">
                System status
              </h2>

              <p className="mt-1 text-[11px] text-gray-400">
                Backend connection
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    name: "Admin dashboard",
                    active: true,
                  },
                  {
                    name: "Express API",
                    active: !error && !!dashboardData,
                  },
                  {
                    name: "MySQL database",
                    active: !error && !!dashboardData,
                  },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-600">
                      {service.name}
                    </span>

                    <span className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span
                        className={`h-2 w-2 rounded-full ${service.active ? "bg-green-500" : "bg-red-400"
                          }`}
                      />
                      {service.active ? "Connected" : "Unavailable"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-[#f5f9f7] p-3">
                <p className="text-xs font-medium text-gray-700">
                  Dashboard connected
                </p>
                <p className="mt-1 text-[10px] leading-5 text-gray-500">
                  Statistics are retrieved from your existing Express API
                  and MySQL database.
                </p>
              </div>
            </div>
          </section>

          <QuickActions />

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8eeeb] pt-5 text-[10px] text-gray-400">
            <p>RENDEZVOUS 2026 · ADMINISTRATION</p>
            <p>Management Console</p>
          </footer>
        </main>
      </div>
    </div>
  );
}