import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";

const schema = z.object({ name: z.string().min(2), date: z.string(), time: z.string().optional(), location: z.string().optional(), meetingType: z.string().min(2), notes: z.string().optional() });

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to create sessions." }, { status: 403 });
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Add an event name, date, and meeting type." }, { status: 400 });
  const members = await prisma.member.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  const session = await prisma.attendanceSession.create({ data: { ...body.data, date: new Date(body.data.date), attendance: { create: members.map((member) => ({ memberId: member.id })) } }, include: { attendance: true } });
  return NextResponse.json({ session }, { status: 201 });
}
