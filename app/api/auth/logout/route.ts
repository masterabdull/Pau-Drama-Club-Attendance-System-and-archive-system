import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { rejectCrossSiteRequest } from "@/lib/security";

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  await clearSession();
  return NextResponse.json({ ok: true });
}
