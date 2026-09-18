import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConfiguredSuperAdmin } from "@/lib/permissions";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  birthday: z.string().date().optional(),
  course: z.string().trim().min(2).max(120).optional(),
  level: z.string().trim().min(1).max(40).optional(),
  hostel: z.string().trim().min(2).max(120).optional(),
  pronouns: z.string().trim().min(2).max(40).optional(),
  gender: z.string().trim().min(2).max(40).optional(),
  password: z.string().min(12).max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
}).refine((data) => isConfiguredSuperAdmin(data.email) || Boolean(data.birthday && data.course && data.level && data.hostel && data.pronouns && data.gender), {
  message: "Complete all member profile fields.",
  path: ["course"],
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    const passwordError = body.error.issues.some((issue) => issue.path.includes("confirmPassword"));
    return NextResponse.json({ error: passwordError ? "Passwords do not match." : "Complete all fields with valid information." }, { status: 400 });
  }

  const email = body.data.email.toLowerCase();
  const isSuperAdmin = isConfiguredSuperAdmin(email);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      name: body.data.fullName,
      email,
      passwordHash: await hashPassword(body.data.password),
      role: isSuperAdmin ? "SUPER_ADMIN" : "MEMBER",
    },
  });
  if (!isSuperAdmin) {
    await prisma.member.create({
      data: {
        fullName: body.data.fullName,
        email,
        birthday: new Date(`${body.data.birthday}T00:00:00.000Z`),
        course: body.data.course,
        level: body.data.level,
        hostel: body.data.hostel,
        pronouns: body.data.pronouns,
        gender: body.data.gender,
        userId: user.id,
        joinedAt: new Date(),
      },
    });
  }
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}