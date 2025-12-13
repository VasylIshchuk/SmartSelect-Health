"use client";

import InfoBadge from "@/components/shared/InfoBadge";
import { doctorDashboardData } from "@/data/dashboard-data";
import type { Account } from "@/types/account";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function DoctorDashboard() {
  const [diagnosis, setDiagnosis] = useState("");
  const [aiRating, setAiRating] = useState<"accurate" | "inaccurate" | null>(
    null
  );
  const [savedMessage, setSavedMessage] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState(
    doctorDashboardData.schedule[0]?.id
  );

  const selectedVisit = useMemo(
    () =>
      doctorDashboardData.schedule.find(
        (visit) => visit.id === selectedVisitId
      ) ?? doctorDashboardData.schedule[0],
    [selectedVisitId]
  );

  const handleSave = () => {
    setSavedMessage("Wizyta została zapisana.");
    setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <section className="w-full space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* <p className="text-sm text-slate-500">{user.subtitle}</p> */}
          <h2 className="text-3xl font-semibold text-slate-900">
            {/* Dzień dobry, {user.name}! */}
          </h2>
          <p className="text-sm text-slate-500">
            Zarządzaj wizytami i przeglądaj raporty
          </p>
        </div>
        <button
          //   onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          Wyloguj
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {doctorDashboardData.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Kalendarz wizyt</p>
              <h3 className="text-2xl font-semibold text-slate-900">
                {doctorDashboardData.scheduleDate}
              </h3>
            </div>
            <CalendarDays className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 space-y-4">
            {doctorDashboardData.schedule.map((visit) => (
              <button
                key={visit.id}
                onClick={() => setSelectedVisitId(visit.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  visit.id === selectedVisit?.id
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-100 hover:border-blue-200 hover:bg-blue-50/60"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {visit.patient}
                    </p>
                    <p className="text-sm text-slate-500">{visit.type}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span>{visit.time}</span>
                    <span>{visit.duration}</span>
                    {visit.hasReport && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        Raport AI
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">{visit.symptoms}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div>
            <p className="text-sm text-slate-500">Wybrana wizyta</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {selectedVisit?.patient}
            </h3>
          </div>
          {selectedVisit?.hasReport && selectedVisit.visitInfo ? (
            <>
              <div className="grid gap-3 text-sm text-slate-600">
                <InfoBadge
                  label="Imię i nazwisko"
                  value={selectedVisit.visitInfo.patient.name}
                />
                <InfoBadge
                  label="Wiek"
                  value={selectedVisit.visitInfo.patient.age}
                />
                <InfoBadge
                  label="PESEL"
                  value={selectedVisit.visitInfo.patient.pesel}
                />
              </div>

              <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">
                      Raport wstępny AI
                    </p>
                    <p className="text-xs text-slate-500">
                      Pewność:{" "}
                      {Math.round(
                        (selectedVisit.visitInfo.report.confidence ?? 0) * 100
                      )}
                      %
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <dt className="font-semibold text-slate-900">
                      Zgłoszone objawy
                    </dt>
                    <dd>{selectedVisit.visitInfo.report.symptoms}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">
                      Czas trwania
                    </dt>
                    <dd>{selectedVisit.visitInfo.report.duration}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">
                      Dodatkowe informacje
                    </dt>
                    <dd>{selectedVisit.visitInfo.report.info}</dd>
                  </div>
                </dl>
                <div className="mt-4 rounded-2xl bg-white/90 p-4">
                  <p className="text-xs uppercase text-purple-500">
                    Sugestia AI
                  </p>
                  <p className="text-lg font-semibold text-purple-900">
                    {selectedVisit.visitInfo.report.suggestion}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedVisit.visitInfo.report.tests.map((test) => (
                    <span
                      key={test}
                      className="rounded-full border border-purple-100 bg-white px-4 py-1 text-xs font-medium text-purple-900"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Brak raportu AI dla tej wizyty.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">
          Dokumentacja wizyty
        </h3>
        <label
          className="mt-4 text-sm font-medium text-slate-600"
          htmlFor="diagnosis"
        >
          Finalna diagnoza
        </label>
        <textarea
          id="diagnosis"
          rows={5}
          value={diagnosis}
          onChange={(event) => setDiagnosis(event.target.value)}
          placeholder="Wprowadź finalną diagnozę..."
          className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
        />
        <div className="mt-6">
          <p className="text-sm font-medium text-slate-600">
            Ocena sugestii AI
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setAiRating("accurate")}
              className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                aiRating === "accurate"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              Trafna
            </button>
            <button
              type="button"
              onClick={() => setAiRating("inaccurate")}
              className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                aiRating === "inaccurate"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-rose-200 hover:bg-rose-50"
              }`}
            >
              Nietrafna
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <ClipboardCheck className="h-4 w-4" />
          Zapisz i zakończ wizytę
        </button>
        {savedMessage && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {savedMessage}
          </p>
        )}
      </section>
    </section>
  );
}
