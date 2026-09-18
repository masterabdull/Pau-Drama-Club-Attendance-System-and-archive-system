import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";

const schema = z.object({ fullName: z.string().min(2), studentId: z.string().min(2), email: z.string().email().optional().or(z.literal("")), department: z.string().optional(), level: z.string().optional(), clubRole: z.string().optional() });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const search = new URL(request.url).searchParams.get("search") || "";
  const ownMember = user.role === "MEMBER" ? { OR: [{ userId: user.id }, { email: user.email }] } : {};
  const members = await prisma.member.findMany({ where: { ...ownMember, OR: [{ fullName: { contains: search } }, { department: { contains: search } }] }, orderBy: { fullName: "asc" }, include: { attendance: true } });
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to add members." }, { status: 403 });
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Name and student ID are required." }, { status: 400 });
  const member = await prisma.member.create({ data: { ...body.data, email: body.data.email || null } });
  return NextResponse.json({ member }, { status: 201 });
}
