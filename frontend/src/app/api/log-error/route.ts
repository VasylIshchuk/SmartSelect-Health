import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { level, message, context, stack } = body;

  const logData = {
    timestamp: new Date().toISOString(),
    context: context || "Unknown",
    message,
    ...(stack && { stack }),
  };

  switch (level) {
    case "warn":
      console.warn("🟡 [WARN]:", logData);
      break;
    
    case "info":
      console.log("🔵 [INFO]:", logData);
      break;

    case "error":
    default:
      console.error("🔴 [ERROR]:", logData);
      break;
  }

  return NextResponse.json({ received: true });
}