import { LogOut } from "lucide-react";
import type { Account } from "@/types/account";
import Link from "next/link";

type DashboardHeaderProps = {
  user: Account;
};

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex flex-row items-center justify-between w-full">
      <div>
        <p className="text-sm text-slate-500">{user.subtitle}</p>
        <h2 className="text-3xl font-semibold text-slate-900">
          Hi, {user.name}!
        </h2>
        <p className="text-sm text-slate-500">
          Manage appointments and view reports
        </p>
      </div>
      <Link
        href={"/login"}
        className="whitespace-nowrap inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Link>
    </header>
  );
}
