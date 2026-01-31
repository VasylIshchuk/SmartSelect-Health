"use client";
import {
  Edit2,
  LogOut,
  Search,
  Trash2,
  UserPlus,
  Users,
  Mail,
  Calendar,
  Briefcase,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Doctor, useAdmin } from "@/hooks/useAdmin";
import DashboardHeader from "@/components/shared/DashboardHeader";

const ITEMS_PER_PAGE = 5;

export default function AdminDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { getDoctors, deleteDoctor, addDoctor, isLoading } = useAdmin();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchAllDoctors = async () => {
      const fetchedDoctors = await getDoctors("");
      setAllDoctors(fetchedDoctors || []);
    };
    fetchAllDoctors();
  }, [getDoctors, addDoctor]);

  useEffect(() => {
    const fetchDoctors = async () => {
      const fetchedDoctors = await getDoctors(debouncedSearchQuery);
      setDoctors(fetchedDoctors || []);
      setCurrentPage(1); // Reset to first page when search changes
    };
    fetchDoctors();
  }, [getDoctors, debouncedSearchQuery]);

  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return doctors.slice(startIndex, endIndex);
  }, [doctors, currentPage]);

  const totalPages = Math.ceil(doctors.length / ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    await deleteDoctor(id);
    setDoctors((prev: Doctor[]) => prev.filter((d: Doctor) => d.id !== id));
    setAllDoctors((prev: Doctor[]) => prev.filter((d: Doctor) => d.id !== id));
  };

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      total: allDoctors.length,
      withEmail: allDoctors.filter((d) => d.email).length,
      recent: allDoctors.filter(
        (d) => d.work_start_date && new Date(d.work_start_date) > thirtyDaysAgo,
      ).length,
    };
  }, [allDoctors]);

  return (
    <div className="h-screen overflow-hidden from-slate-50 via-white to-slate-50">
      <section className="flex h-full flex-col gap-6 py-6 lg:py-8">
        {/* Header */}

        <DashboardHeader />

        {/* Stats Cards */}
        <div className="grid shrink-0 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total Doctors"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={Mail}
            label="With Email"
            value={stats.withEmail}
            color="emerald"
          />
          <button
            onClick={() => router.push("/admin/statistics")}
            className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-left shadow-lg shadow-purple-500/25 ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]"
          >
            <div>
              <p className="text-sm font-medium text-white/90">
                View Statistics
              </p>
              <p className="mt-2 text-2xl font-bold text-white">Analytics</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white shadow-lg">
              <Calendar className="h-6 w-6" />
            </div>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50 lg:p-8">
          {/* Toolbar */}
          <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Doctor Management
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, view, and manage all doctors in the system
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or specialization..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
              {/* Loading Indicator */}
              <div className="flex h-10 min-w-[100px] items-center justify-center">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="text-sm text-transparent">Loading...</div>
                )}
              </div>
              {/* Add Button */}
              <button
                onClick={() => router.push("/admin/add-doctor")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4" />
                Add Doctor
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 sm:px-6">
                      Doctor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 sm:px-6">
                      Specialization
                    </th>
                    <th className="hidden px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 sm:table-cell sm:px-6">
                      Email
                    </th>
                    <th className="hidden px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 md:table-cell md:px-6">
                      Start Date
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-700 sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading && doctors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                        <p className="mt-2 text-sm">Loading doctors...</p>
                      </td>
                    </tr>
                  ) : paginatedDoctors.length > 0 ? (
                    paginatedDoctors.map((doctor) => (
                      <DoctorTableRow
                        key={doctor.id}
                        doctor={doctor}
                        onEdit={() =>
                          router.push(`/admin/update-doctor/${doctor.id}`)
                        }
                        onDelete={() => handleDelete(doctor.id)}
                        isLoading={isLoading}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        <Users className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-4 text-sm font-medium">
                          No doctors found
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {searchQuery
                            ? "Try adjusting your search"
                            : "Add your first doctor to get started"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination & Results Info */}
          <div className="mt-4 flex shrink-0 flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
            {doctors.length > 0 && (
              <div className="text-sm text-slate-500">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  doctors.length,
                )}{" "}
                to {Math.min(currentPage * ITEMS_PER_PAGE, doctors.length)} of{" "}
                {doctors.length} doctors
              </div>
            )}
            {doctors.length > ITEMS_PER_PAGE && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
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
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
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

function DoctorTableRow({
  doctor,
  onEdit,
  onDelete,
  isLoading,
}: {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
  isLoading: boolean;
}) {
  return (
    <tr className="transition-colors duration-150 hover:bg-slate-50/50">
      <td className="px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
            {doctor.first_name?.[0]}
            {doctor.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">
              {doctor.first_name} {doctor.last_name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 sm:hidden">
              {doctor.email || "No email"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Briefcase className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
          <span className="truncate text-sm text-slate-700">
            {doctor.specialization || "—"}
          </span>
        </div>
      </td>
      <td className="hidden px-4 py-4 sm:table-cell sm:px-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate text-sm text-slate-700">
            {doctor.email || "—"}
          </span>
        </div>
      </td>
      <td className="hidden px-4 py-4 md:table-cell md:px-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="text-sm text-slate-700">
            {doctor.work_start_date
              ? new Date(doctor.work_start_date).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="rounded-lg p-2 text-red-600 transition-all duration-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
              currentPage === pageNum
                ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
