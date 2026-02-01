"use client";

import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import {
  VictoryChart,
  VictoryBar,
  VictoryArea,
  VictoryAxis,
  VictoryTheme,
  VictoryLegend,
} from "victory";

export default function StatisticsPage() {
  const router = useRouter();
  const { getDoctors, getVisits, getReports } = useAdmin();
  const [allDoctors, setAllDoctors] = useState<
    Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      work_start_date: string;
    }>
  >([]);
  const [visits, setVisits] = useState<
    Array<{
      id: string;
      scheduled_time?: string;
      created_at?: string | null;
    }>
  >([]);
  const [reports, setReports] = useState<
    Array<{
      id: string;
      created_at?: string | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [doctorsData, visitsData, reportsData] = await Promise.all([
        getDoctors(""),
        getVisits(),
        getReports(),
      ]);
      console.log("Statistics page - fetched data:", {
        doctors: doctorsData?.length || 0,
        visits: visitsData?.length || 0,
        reports: reportsData?.length || 0,
        visitsData,
        reportsData,
      });
      setAllDoctors(doctorsData || []);
      setVisits(visitsData || []);
      setReports(reportsData || []);
      setIsLoading(false);
    };
    fetchData();
  }, [getDoctors, getVisits, getReports]);

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const total = allDoctors.length;
    const withEmail = allDoctors.filter((d) => d.email).length;
    const recent = allDoctors.filter(
      (d) => d.work_start_date && new Date(d.work_start_date) > thirtyDaysAgo
    ).length;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousPeriod = allDoctors.filter(
      (d) =>
        d.work_start_date &&
        new Date(d.work_start_date) > sixtyDaysAgo &&
        new Date(d.work_start_date) <= thirtyDaysAgo
    ).length;
    const growthRate =
      previousPeriod > 0
        ? Math.round(((recent - previousPeriod) / previousPeriod) * 100)
        : recent > 0
        ? 100
        : 0;

    return {
      total,
      withEmail,
      recent,
      growthRate,
      previousPeriod,
    };
  }, [allDoctors]);

  const visitsData = useMemo(() => {
    const daysMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
      daysMap.set(dayKey, 0);
    }

    visits.forEach((visit) => {
      const dateStr = visit.scheduled_time || visit.created_at;
      if (!dateStr) return;
      const visitDate = new Date(dateStr);
      const dayKey = visitDate.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const currentCount = daysMap.get(dayKey) || 0;
      daysMap.set(dayKey, currentCount + 1);
    });

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
      days.push({
        x: dayKey,
        y: daysMap.get(dayKey) || 0,
      });
    }
    return days;
  }, [visits]);

  const reportsData = useMemo(() => {
    const daysMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
      daysMap.set(dayKey, 0);
    }

    reports.forEach((report) => {
      const dateStr = report.created_at;
      if (!dateStr) return;
      const reportDate = new Date(dateStr);
      const dayKey = reportDate.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const currentCount = daysMap.get(dayKey) || 0;
      daysMap.set(dayKey, currentCount + 1);
    });

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
      days.push({
        x: dayKey,
        y: daysMap.get(dayKey) || 0,
      });
    }
    return days;
  }, [reports]);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const visitsByMonth = new Map<string, number>();
    const reportsByMonth = new Map<string, number>();

    monthNames.forEach((month) => {
      visitsByMonth.set(month, 0);
      reportsByMonth.set(month, 0);
    });

    visits.forEach((visit) => {
      const dateStr = visit.scheduled_time || visit.created_at;
      if (!dateStr) return;
      const visitDate = new Date(dateStr);
      const monthIndex = visitDate.getMonth();
      if (monthIndex >= 0 && monthIndex < 6) {
        const month = monthNames[monthIndex];
        visitsByMonth.set(month, (visitsByMonth.get(month) || 0) + 1);
      }
    });

    reports.forEach((report) => {
      const dateStr = report.created_at;
      if (!dateStr) return;
      const reportDate = new Date(dateStr);
      const monthIndex = reportDate.getMonth();
      if (monthIndex >= 0 && monthIndex < 6) {
        const month = monthNames[monthIndex];
        reportsByMonth.set(month, (reportsByMonth.get(month) || 0) + 1);
      }
    });

    return monthNames.map((month) => ({
      x: month,
      visits: visitsByMonth.get(month) || 0,
      reports: reportsByMonth.get(month) || 0,
    }));
  }, [visits, reports]);

  return (
    <div className="h-screen overflow-hidden from-slate-50 via-white to-slate-50">
      <section className="flex h-full flex-col gap-6 py-6 lg:py-8">
        <header className="flex shrink-0 items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Statistics</h1>
              <p className="mt-1 text-sm text-slate-500">
                View detailed analytics and charts
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
          {isLoading ? (
            <div className="grid shrink-0 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : (
            <div className="grid shrink-0 gap-4 sm:grid-cols-3">
              <StatOverviewCard
                icon={Users}
                label="Total Doctors"
                value={stats.total.toString()}
                change={`${stats.recent} new`}
                trend="up"
                color="blue"
              />
              <StatOverviewCard
                icon={Activity}
                label="With Email"
                value={stats.withEmail.toString()}
                change={`${
                  Math.round((stats.withEmail / stats.total) * 100) || 0
                }%`}
                trend="up"
                color="emerald"
              />
              <StatOverviewCard
                icon={TrendingUp}
                label="Growth Rate"
                value={`${stats.growthRate}%`}
                change={`${stats.recent} this month`}
                trend={stats.growthRate >= 0 ? "up" : "down"}
                color="purple"
              />
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Visits This Week
                      </h2>
                      <p className="text-xs text-slate-500">
                        Daily visits count
                      </p>
                    </div>
                  </div>
                </div>
                {visitsData.every((d) => d.y === 0) ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                    <div className="text-center">
                      <Activity className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-400">
                        No data available
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64">
                    <VictoryChart
                      theme={VictoryTheme.material}
                      domainPadding={20}
                      height={256}
                    >
                      <VictoryAxis
                        style={{
                          axis: { stroke: "#cbd5e1" },
                          tickLabels: { fill: "#64748b", fontSize: 10 },
                          grid: { stroke: "#f1f5f9" },
                        }}
                      />
                      <VictoryAxis
                        dependentAxis
                        style={{
                          axis: { stroke: "#cbd5e1" },
                          tickLabels: { fill: "#64748b", fontSize: 10 },
                          grid: { stroke: "#f1f5f9" },
                        }}
                      />
                      <VictoryBar
                        data={visitsData}
                        style={{
                          data: {
                            fill: "#3b82f6",
                            fillOpacity: 0.8,
                          },
                        }}
                        cornerRadius={{ top: 8 }}
                      />
                    </VictoryChart>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Reports This Week
                      </h2>
                      <p className="text-xs text-slate-500">
                        Daily reports count
                      </p>
                    </div>
                  </div>
                </div>
                {reportsData.every((d) => d.y === 0) ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-400">
                        No data available
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64">
                    <VictoryChart
                      theme={VictoryTheme.material}
                      domainPadding={20}
                      height={256}
                    >
                      <VictoryAxis
                        style={{
                          axis: { stroke: "#cbd5e1" },
                          tickLabels: { fill: "#64748b", fontSize: 10 },
                          grid: { stroke: "#f1f5f9" },
                        }}
                      />
                      <VictoryAxis
                        dependentAxis
                        style={{
                          axis: { stroke: "#cbd5e1" },
                          tickLabels: { fill: "#64748b", fontSize: 10 },
                          grid: { stroke: "#f1f5f9" },
                        }}
                      />
                      <VictoryBar
                        data={reportsData}
                        style={{
                          data: {
                            fill: "#10b981",
                            fillOpacity: 0.8,
                          },
                        }}
                        cornerRadius={{ top: 8 }}
                      />
                    </VictoryChart>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Monthly Analytics
                    </h2>
                    <p className="text-xs text-slate-500">
                      Visits vs Reports comparison
                    </p>
                  </div>
                </div>
              </div>
              {monthlyData.every((d) => d.visits === 0 && d.reports === 0) ? (
                <div className="flex h-80 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-16 w-16 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-400">
                      No data available
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-80">
                  <VictoryChart
                    theme={VictoryTheme.material}
                    domainPadding={30}
                    height={320}
                  >
                    <VictoryLegend
                      x={50}
                      y={10}
                      orientation="horizontal"
                      gutter={20}
                      style={{
                        labels: { fill: "#64748b", fontSize: 12 },
                      }}
                      data={[
                        { name: "Visits", symbol: { fill: "#3b82f6" } },
                        { name: "Reports", symbol: { fill: "#10b981" } },
                      ]}
                    />
                    <VictoryAxis
                      style={{
                        axis: { stroke: "#cbd5e1" },
                        tickLabels: { fill: "#64748b", fontSize: 10 },
                        grid: { stroke: "#f1f5f9" },
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      style={{
                        axis: { stroke: "#cbd5e1" },
                        tickLabels: { fill: "#64748b", fontSize: 10 },
                        grid: { stroke: "#f1f5f9" },
                      }}
                    />
                    <VictoryArea
                      data={monthlyData}
                      x="x"
                      y="visits"
                      style={{
                        data: {
                          fill: "#3b82f6",
                          fillOpacity: 0.3,
                          stroke: "#3b82f6",
                          strokeWidth: 2,
                        },
                      }}
                    />
                    <VictoryArea
                      data={monthlyData}
                      x="x"
                      y="reports"
                      style={{
                        data: {
                          fill: "#10b981",
                          fillOpacity: 0.3,
                          stroke: "#10b981",
                          strokeWidth: 2,
                        },
                      }}
                    />
                  </VictoryChart>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatOverviewCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: "blue" | "emerald" | "purple";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/25",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/25",
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={`text-xs font-semibold ${
                trend === "up" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {change}
            </span>
            <span className="text-xs text-slate-500">vs last month</span>
          </div>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
