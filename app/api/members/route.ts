import { NextResponse } from "next/server";
import type { MembershipStatus } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";

const schema = z.object({ fullName: z.string().min(2), studentId: z.string().trim().max(50).optional().or(z.literal("")), email: z.string().email().optional().or(z.literal("")), birthday: z.coerce.date().optional().nullable(), course: z.string().optional(), hostel: z.string().optional(), pronouns: z.string().optional(), gender: z.string().optional(), department: z.string().optional(), level: z.string().optional(), clubRole: z.string().optional() });
const updateSchema = schema.extend({ id: z.string().min(1), status: z.enum(["ACTIVE", "INACTIVE"]).optional() });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const search = new URL(request.url).searchParams.get("search") || "";
  const department = new URL(request.url).searchParams.get("department") || "";
  const level = new URL(request.url).searchParams.get("level") || "";
  const clubRole = new URL(request.url).searchParams.get("clubRole") || "";
  const status = new URL(request.url).searchParams.get("status") || "";
  const ownMember = user.role === "MEMBER" ? { OR: [{ userId: user.id }, { email: user.email }] } : {};
  const filters = { ...(department ? { department: { contains: department } } : {}), ...(level ? { level: { contains: level } } : {}), ...(clubRole ? { clubRole: { contains: clubRole } } : {}), ...(status === "ACTIVE" || status === "INACTIVE" ? { status: status as MembershipStatus } : {}) };
  const textFilter = search ? { OR: [{ fullName: { contains: search } }, { department: { contains: search } }, { level: { contains: search } }, { clubRole: { contains: search } }] } : {};
  const members = await prisma.member.findMany({ where: { ...ownMember, ...filters, ...textFilter }, orderBy: { fullName: "asc" }, include: { attendance: { include: { session: true } } } });
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to add members." }, { status: 403 });
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Enter valid member information." }, { status: 400 });
  const member = await prisma.member.create({ data: { ...body.data, email: body.data.email || null } });
  return NextResponse.json({ member }, { status: 201 });
}

export async function PATCH(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageAttendance(user.role)) return NextResponse.json({ error: "You do not have permission to edit members." }, { status: 403 });
  const body = updateSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Enter valid member information." }, { status: 400 });
  const { id, ...data } = body.data;
  const member = await prisma.member.update({ where: { id }, data: { ...data, email: data.email || null, studentId: data.studentId || null } });
  return NextResponse.json({ member });
}
