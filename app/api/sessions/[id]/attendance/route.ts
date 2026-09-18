import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";

const schema = z.object({ memberId: z.string(), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to edit attendance." }, { status: 403 });
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid attendance update." }, { status: 400 });
  const { id } = await context.params;
  const record = await prisma.attendance.upsert({ where: { memberId_sessionId: { memberId: body.data.memberId, sessionId: id } }, update: { status: body.data.status }, create: { memberId: body.data.memberId, sessionId: id, status: body.data.status } });
  return NextResponse.json({ record });
}
