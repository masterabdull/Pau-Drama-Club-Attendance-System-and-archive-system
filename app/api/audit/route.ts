import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConfiguredSuperAdmin } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN" || !isConfiguredSuperAdmin(user.email)) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } } } });
  return NextResponse.json({ logs });
}