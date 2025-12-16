"use client";

import { DOCTORS } from "@/data/dashboard-data";
import type { Account } from "@/types/account";
import { Edit2, LogOut, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Doctor } from "@/types/Doctor";
import { useDoctors } from "@/hooks/useDoctors";
import { AddDoctor } from "@/components/shared/AddDoctor";
import { UpdateDoctor } from "@/components/shared/UpdateDoctor";
import Link from "next/link";

type AdminView = "overview" | "addDoctor" | "updateDoctor";

export default function AdminDashboard() {
  const { doctors, deleteDoctor } = useDoctors();

  const [view, setView] = useState<AdminView>("overview");
  const [updateDoctor, setUpdateDoctor] = useState<Doctor>(null);
  if (view === "addDoctor") {
    return (
      <AddDoctor
        onBack={() => setView("overview")}
        onCancel={() => setView("overview")}
      />
    );
  } else if (view === "updateDoctor") {
    return (
      <UpdateDoctor
        doctor={updateDoctor}
        onBack={() => {
          setView("overview");
          setUpdateDoctor(null);
        }}
        onCancel={() => setView("overview")}
      />
    );
  }

  return (
    <section className="flex-col space-y-8 flex">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {/* {user.name} */}
              </h2>
              {/* <p className="text-sm text-slate-500">{user.subtitle}</p> */}
            </div>
          </div>
        </div>
        <Link
          href={"/login"}
          //   onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Link>
      </header>

      <h1 className="text-3xl font-bold text-slate-900">Manage system</h1>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Manage doctors</h3>
          </div>
          <button
            onClick={() => setView("addDoctor")}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Add new doctor
          </button>
        </div>

        <div className="max-h-130 overflow-y-auto">
          <table className="w-full text-left text-sm ">
            <thead className="sticky top-0 bg-white border-b border-slate-200 ">
              <tr>
                <th className="pb-3 font-semibold text-slate-900">
                  Name and Surname
                </th>
                <th className="pb-3 font-semibold text-slate-900">Email</th>
                <th className="pb-3 font-semibold text-slate-900">
                  Specialization
                </th>
                <th className="pb-3 font-semibold text-slate-900">
                  Start work date
                </th>
                <th className="pb-3 font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>

            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor?.id} className="border-b border-slate-100">
                  <td className="py-4 text-slate-900">
                    Dr. {doctor?.firstName} {doctor?.lastName}
                  </td>
                  <td className="py-4 text-slate-600">{doctor?.email}</td>
                  <td className="py-4 text-slate-600">
                    {doctor?.specialization}
                  </td>
                  <td className="py-4 text-slate-600">
                    {doctor?.workStartDate}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUpdateDoctor(doctor);
                          setView("updateDoctor");
                        }}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDoctor(doctor!.id)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
