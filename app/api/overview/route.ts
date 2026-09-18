import { NextResponse } from "next/server";
import type { Confidentiality } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { archiveScope, isConfiguredSuperAdmin } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role === "MEMBER") {
    const member = await prisma.member.findFirst({ where: { status: "ACTIVE", OR: [{ userId: user.id }, { email: user.email }] }, include: { attendance: true } });
    const attendance = member?.attendance || [];
    const attended = attendance.filter((item: any) => item.status === "PRESENT" || item.status === "LATE").length;
    const publicArchive = await prisma.archiveItem.findMany({ where: { deletedAt: null, confidentiality: "PUBLIC" }, select: { mimeType: true } });
    const byKind = publicArchive.reduce((result: Record<string, number>, item: any) => {
      const kind = item.mimeType.startsWith("image/") ? "Images" : item.mimeType.startsWith("video/") ? "Videos" : item.mimeType.startsWith("audio/") ? "Audio" : "Documents";
      result[kind] = (result[kind] || 0) + 1;
      return result;
    }, {});
    return NextResponse.json({ memberOnly: true, stats: { members: member ? 1 : 0, sessions: attendance.length, averageAttendance: attendance.length ? (attended / attendance.length) * 100 : 0, archiveItems: publicArchive.length, byKind }, ranking: [], sessions: [], archive: [], memberAttendance: attendance });
  }
  const scope = isConfiguredSuperAdmin(user.email) ? archiveScope(user.role) : user.role === "SUPER_ADMIN" ? "public" : archiveScope(user.role);
  const archiveVisibility: { in: Confidentiality[] } | undefined = scope === "all" ? undefined : scope === "public" ? { in: ["PUBLIC"] } : { in: ["PUBLIC", "INTERNAL", "EXECUTIVE"] };
  const [members, sessions, archive, attendance]: any[] = await Promise.all([
    prisma.member.findMany({ where: { status: "ACTIVE" }, include: { attendance: true }, orderBy: { fullName: "asc" } }),
    prisma.attendanceSession.findMany({ orderBy: { date: "desc" }, include: { attendance: true } }),
    prisma.archiveItem.findMany({ where: { deletedAt: null, ...(archiveVisibility ? { confidentiality: archiveVisibility } : {}) }, orderBy: { createdAt: "desc" }, take: 8, include: { uploadedBy: { select: { name: true } } } }),
    prisma.attendance.findMany(),
  ]);
  const attended = attendance.filter((item: any) => item.status === "PRESENT" || item.status === "LATE").length;
  const averageAttendance = attendance.length ? (attended / attendance.length) * 100 : 0;
  const now = new Date();
  const meetingsThisMonth = sessions.filter((session: any) => { const date = new Date(session.date); return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth(); }).length;
  const ranking = members.map((member: any) => {
    const count = member.attendance.length;
    const present = member.attendance.filter((item: any) => item.status === "PRESENT" || item.status === "LATE").length;
    return { id: member.id, name: member.fullName, attended: present, held: count, rate: count ? (present / count) * 100 : 0 };
  }).sort((a: any, b: any) => b.rate - a.rate);
  const byKind = archive.reduce((result: Record<string, number>, item: any) => {
    const kind = item.mimeType.startsWith("image/") ? "Images" : item.mimeType.startsWith("video/") ? "Videos" : item.mimeType.startsWith("audio/") ? "Audio" : "Documents";
    result[kind] = (result[kind] || 0) + 1;
    return result;
  }, {});
  const trends = sessions.slice().reverse().map((session: any) => {
    const total = session.attendance.length;
    const present = session.attendance.filter((item: any) => item.status === "PRESENT" || item.status === "LATE").length;
    return { label: new Date(session.date).toLocaleDateString("en", { month: "short", day: "numeric" }), rate: total ? Math.round((present / total) * 100) : 0 };
  });
  const byMeetingType = sessions.reduce((result: Record<string, number>, session: any) => {
    const total = session.attendance.length;
    const present = session.attendance.filter((item: any) => item.status === "PRESENT" || item.status === "LATE").length;
    result[session.meetingType] = total ? Math.round((result[session.meetingType] || 0) + (present / total) * 100) : result[session.meetingType] || 0;
    return result;
  }, {});
  return NextResponse.json({ stats: { members: members.length, sessions: await prisma.attendanceSession.count(), meetingsThisMonth, highestAttendance: ranking.length ? Math.round(ranking[0].rate) : 0, lowestAttendance: ranking.length ? Math.round(ranking[ranking.length - 1].rate) : 0, averageAttendance, archiveItems: await prisma.archiveItem.count({ where: { deletedAt: null } }), byKind, trends, byMeetingType }, ranking, sessions, archive });
}
