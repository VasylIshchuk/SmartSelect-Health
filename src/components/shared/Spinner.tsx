import { Loader2 } from "lucide-react";

export const Spinner = () => {
  return (
    <div className="flex w-full flex-1 items-center justify-center py-12">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );
};