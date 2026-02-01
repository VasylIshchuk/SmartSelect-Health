"use client";

type InfoBadgeProps = {
  label: string;
  value: string | number;
};

export default function InfoBadge({ label, value }: InfoBadgeProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

