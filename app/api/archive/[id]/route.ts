import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !["EXECUTIVE", "SUPER_ADMIN", "SECRETARY"].includes(user.role)) return NextResponse.json({ error: "You do not have permission to remove archive items." }, { status: 403 });
  const { id } = await context.params;
  const item = await prisma.archiveItem.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { action: "recycled", entity: "archive", entityId: id, userId: user.id } });
  return NextResponse.json({ item });
}
