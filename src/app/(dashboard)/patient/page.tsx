"use client";

import {
  patientAppointments,
  patientInterview,
  patientInterviewHistory,
  patientPortalData,
} from "@/data/dashboard-data";
import type { Account } from "@/types/account";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Clock,
  LogOut,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type PatientView = "overview" | "interview" | "visits" | "history";

type ChatMessage = {
  id: string;
  author: "ai" | "user";
  text: string;
  time: string;
};

export default function PatientDashboard() {
  //   const firstName = user.name.split(" ")[0];
  const [view, setView] = useState<PatientView>("overview");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    patientInterview.initialMessages
  );
  const [chatInput, setChatInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const message = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      author: "user" as const,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, message]);
    setChatInput("");
    setIsResponding(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : String(Date.now() + 1),
          author: "ai" as const,
          text: "Dziękuję za informację. Czy występują dodatkowe objawy, np. gorączka lub kaszel?",
          time: new Date().toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setIsResponding(false);
    }, 1200);
  };

  const quickActions = useMemo(() => patientPortalData.quickActions, []);
  const upcoming = patientAppointments.upcoming;

  const renderHeader = (title: string, subtitle?: string) => (
    <div className="flex items-center justify-between">
      <div>
        <button
          onClick={() => setView("overview")}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm text-slate-500 transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć
        </button>
        <h3 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <section className="w-full space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* <p className="text-sm text-slate-500">{user.subtitle}</p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Witaj, {firstName}!
          </h2> */}
          <p className="text-sm text-slate-500">
            Zarządzaj swoim zdrowiem i wizytami
          </p>
        </div>
        <Link
          href={"/login"}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          Wyloguj
        </Link>
      </header>

      {view === "overview" && (
        <>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    Asystent Medyczny AI
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    Rozpocznij nowy wywiad
                  </h3>
                  <p className="mt-3 max-w-xl text-sm text-slate-600">
                    {patientPortalData.interviewCopy}
                  </p>
                </div>
                <Sparkles className="h-10 w-10 text-blue-400" />
              </div>
              <button
                onClick={() => setView("interview")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-medium text-blue-600 transition hover:border-blue-300"
              >
                <MessageSquare className="h-4 w-4" />
                Rozpocznij nowy wywiad
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-500">
                Szybkie akcje
              </p>
              <div className="mt-4 space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setView(action.targetView as PatientView)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">
                Najbliższa wizyta
              </p>
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 rounded-3xl border border-slate-100 p-5">
              <p className="text-base font-semibold text-slate-900">
                {patientPortalData.upcomingHighlight.doctor}
              </p>
              <p className="text-sm text-slate-500">
                {patientPortalData.upcomingHighlight.specialization}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {patientPortalData.upcomingHighlight.time}
                </span>
                <span>{patientPortalData.upcomingHighlight.date}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  {patientPortalData.upcomingHighlight.status}
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      {view === "interview" && (
        <section className="rounded-3xl bg-white p-0 shadow-sm ring-1 ring-slate-100">
          <header className="flex items-center gap-4 border-b border-slate-100 px-6 py-4">
            <button
              onClick={() => setView("overview")}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Wywiad medyczny</p>
              <h3 className="text-lg font-semibold text-slate-900">
                {patientInterview.title}
              </h3>
            </div>
          </header>

          <div className="flex flex-col gap-4 px-6 py-8">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.author === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-lg rounded-3xl px-5 py-3 text-sm ${
                    message.author === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p>{message.text}</p>
                  <span
                    className={`mt-2 block text-xs ${
                      message.author === "user"
                        ? "text-white/70"
                        : "text-slate-500"
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            ))}
            {isResponding && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs text-slate-500">
                AI analizuje odpowiedź...
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4">
              <input
                className="flex-1 border-none bg-transparent py-3 text-sm outline-none"
                placeholder={patientInterview.inputPlaceholder}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                className="rounded-2xl bg-blue-600 p-2 text-white transition hover:bg-blue-700"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {view === "visits" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          {renderHeader("Moje wizyty", patientAppointments.upcoming[0]?.date)}
          <div className="mt-6 space-y-4">
            {upcoming.map((visit) => (
              <div
                key={`${visit.doctor}-${visit.date}`}
                className="rounded-2xl border border-slate-100 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {visit.doctor}
                    </p>
                    <p className="text-sm text-slate-500">
                      {visit.specialization}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {visit.time}
                    </span>
                    <span>{visit.duration}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      {visit.status}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">{visit.date}</p>
                <p className="text-sm text-slate-500">{visit.location}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "history" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          {renderHeader("Historia wywiadów", "Raporty AI z ostatnich rozmów")}
          <div className="mt-6 space-y-4">
            {patientInterviewHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.summary}
                    </p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
