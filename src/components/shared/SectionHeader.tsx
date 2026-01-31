import { ArrowLeft } from "lucide-react";

type SectionHeaderProps = {
    title: string;
    subtitle: string;
    onBack: () => void;
}

export const SectionHeader = ({ title, subtitle, onBack }: SectionHeaderProps) => (
    <div className="flex items-center gap-4 mb-8">
        <button
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-blue-600"
        >
            <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
    </div>
);

