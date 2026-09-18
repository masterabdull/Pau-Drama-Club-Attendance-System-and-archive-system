import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to delete sessions." }, { status: 403 });
  const { id } = await context.params;
  const session = await prisma.attendanceSession.findMany({ where: { id } });
  if (!session.length) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  await prisma.attendanceSession.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}