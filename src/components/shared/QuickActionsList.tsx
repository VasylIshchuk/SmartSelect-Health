import { QuickActionItem } from "@/data/dashboard-data";

export const QuickActionsList = ({
  actions,
  onNavigate,
}: {
  actions: QuickActionItem[];
  onNavigate: (view: string) => void;
}) => (
  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <p className="text-sm font-semibold text-slate-500">Quick Actions</p>
    <div className="mt-4 space-y-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onNavigate(action.targetView)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
        >
          <p className="text-sm font-semibold text-slate-900">{action.label}</p>
          <p className="text-xs text-slate-500">{action.description}</p>
        </button>
      ))}
    </div>
  </div>
);