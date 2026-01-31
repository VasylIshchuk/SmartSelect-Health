export default function LoadingSpinner({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"
            style={{ animation: "spin 2s linear infinite" }}
          ></div>
        </div>
        <p className="text-lg font-medium text-slate-700">{message}</p>
        <div className="mt-4 flex justify-center gap-1">
          <div
            className="h-2 w-2 rounded-full bg-blue-600"
            style={{
              animation: "bounce 1.4s ease-in-out infinite",
              animationDelay: "-0.3s",
            }}
          ></div>
          <div
            className="h-2 w-2 rounded-full bg-blue-600"
            style={{
              animation: "bounce 1.4s ease-in-out infinite",
              animationDelay: "-0.15s",
            }}
          ></div>
          <div
            className="h-2 w-2 rounded-full bg-blue-600"
            style={{ animation: "bounce 1.4s ease-in-out infinite" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
