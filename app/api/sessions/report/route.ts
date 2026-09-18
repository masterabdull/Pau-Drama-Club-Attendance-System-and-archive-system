import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";

function monthBounds(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return { start: new Date(Date.UTC(year, monthNumber - 1, 1)), end: new Date(Date.UTC(year, monthNumber, 1)) };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to view attendance reports." }, { status: 403 });
  const month = new URL(request.url).searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const bounds = monthBounds(month);
  if (!bounds) return NextResponse.json({ error: "Choose a valid month." }, { status: 400 });

  const [members, sessions] = await Promise.all([
    prisma.member.findMany({ where: { status: "ACTIVE" }, orderBy: { fullName: "asc" } }),
    prisma.attendanceSession.findMany({ where: { date: { gte: bounds.start, lt: bounds.end } }, orderBy: { date: "asc" }, include: { attendance: true } }),
  ]);
  const rows = members.map((member: any) => {
    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
    sessions.forEach((session: any) => {
      const record = session.attendance.find((item: any) => item.memberId === member.id);
      if (record?.status in counts) counts[record.status as keyof typeof counts] += 1;
    });
    const recorded = counts.PRESENT + counts.LATE + counts.ABSENT + counts.EXCUSED;
    return { id: member.id, name: member.fullName, sessions: recorded, ...counts, rate: recorded ? Math.round(((counts.PRESENT + counts.LATE) / recorded) * 100) : 0 };
  });
  return NextResponse.json({ month, sessionCount: sessions.length, sessions: sessions.map((session: any) => ({ id: session.id, name: session.name, date: session.date })), rows });
}