"use client"

import { useSession } from "@/components/hoc/AuthSessionProvider";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Spinner } from "@/components/shared/Spinner";
import { useReport } from "@/hooks/useReport";
import { ReportHistoryItem } from "@/types/report";
import { Calendar, CheckCircle2, File } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function HistoryPage() {
  const router = useRouter();

  const { session } = useSession();

  const [reports, setReports] = useState<ReportHistoryItem[] | null>(null);
  const { getReportsHistory, isLoading } = useReport(session?.user?.id);
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const data = await getReportsHistory();
      if (isMounted) setReports(data);
    };

    loadData();
    return () => { isMounted = false; };
  }, [getReportsHistory]);


  return (
    <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Consultation History"
        subtitle="Archive of completed preliminary diagnoses"
        onBack={() => router.back()}
      />

      {(isLoading || reports === null) ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
          <Spinner />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
          No consultation history.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <HistoryCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </section>
  );
}


const HistoryCard = ({ report }: { report: ReportHistoryItem }) => {

  return (
    <Link
      href={`/patient/history/report/${report.appointmentId}`}
      className="group cursor-pointer flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-100 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
          <File className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{report.reportedSymptoms}</p>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{report.date} · {report.time}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{report.status}</span>
      </div>
    </Link>
  )
};

