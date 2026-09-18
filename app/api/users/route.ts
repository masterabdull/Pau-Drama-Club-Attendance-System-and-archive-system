import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConfiguredSuperAdmin, roleOptions, type AppRole } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";

const role = z.enum(roleOptions as [AppRole, ...AppRole[]]);
const createSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(12).max(128), role });
const updateSchema = z.object({ id: z.string().min(1), role });

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN" || !isConfiguredSuperAdmin(user.email)) return null;
  return user;
}

export async function GET() {
  if (!(await requireSuperAdmin())) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Use a valid name, email, role, and password of at least 12 characters." }, { status: 400 });
  const email = body.data.email.toLowerCase();
  if (body.data.role === "SUPER_ADMIN" && !isConfiguredSuperAdmin(email)) return NextResponse.json({ error: "Only the configured Super Admin email can use this role." }, { status: 403 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "That email already has an account." }, { status: 409 });
  const user = await prisma.user.create({ data: { name: body.data.name, email, passwordHash: await hashPassword(body.data.password), role: body.data.role } });
  await prisma.auditLog.create({ data: { action: "created", entity: "user", entityId: user.id, metadata: JSON.stringify({ email, role: user.role }), userId: admin.id } });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const body = updateSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: body.data.id }, select: { email: true } });
  if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (body.data.role === "SUPER_ADMIN" && !isConfiguredSuperAdmin(target.email)) return NextResponse.json({ error: "Only the configured Super Admin email can use this role." }, { status: 403 });
  if (body.data.id === admin.id && body.data.role !== "SUPER_ADMIN") return NextResponse.json({ error: "You cannot remove your own Super Admin access." }, { status: 400 });
  const user = await prisma.user.update({ where: { id: body.data.id }, data: { role: body.data.role } });
  await prisma.auditLog.create({ data: { action: "role_changed", entity: "user", entityId: user.id, metadata: JSON.stringify({ role: user.role }), userId: admin.id } });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
