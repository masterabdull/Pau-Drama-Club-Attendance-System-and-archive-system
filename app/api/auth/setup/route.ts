import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConfiguredSuperAdmin } from "@/lib/permissions";

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(12).max(128) });

export async function POST(request: Request) {
  if ((await prisma.user.count()) > 0) return NextResponse.json({ error: "An administrator has already been created." }, { status: 409 });
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Enter your name, PAU email, and a password with at least 12 characters." }, { status: 400 });
  const email = body.data.email.toLowerCase();
  if (!isConfiguredSuperAdmin(email)) return NextResponse.json({ error: "Only the configured Super Admin email can create the first administrator account." }, { status: 403 });
  const user = await prisma.user.create({ data: { name: body.data.name, email, passwordHash: await hashPassword(body.data.password), role: "SUPER_ADMIN" } });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}
