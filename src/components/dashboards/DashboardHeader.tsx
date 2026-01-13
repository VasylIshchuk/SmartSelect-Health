import { LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "../hoc/AuthSessionProvider";


export default function DashboardHeader() {
  const { session } = useSession();

  return (
    <header className="flex flex-row items-center justify-between w-full">
      <div>
        <span className="inline-flex shrink-0 items-center rounded-full w-fit border border-blue-200 px-4 py-1 mb-3 text-2xl font-medium text-blue-600">
          BestChoose
        </span>

        <h2 className="text-3xl font-medium text-slate-900">
          Hi, {session?.user?.user_metadata?.first_name} {session?.user?.user_metadata?.last_name}!
        </h2>
        <p className=" text-slate-500">
          Medical System
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
