import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageArchive } from "@/lib/permissions";
import { rejectCrossSiteRequest } from "@/lib/security";
import { z } from "zod";

const metadataSchema = z.object({ fileName: z.string().trim().min(1).max(255).optional(), category: z.string().trim().min(1).max(80).optional(), year: z.number().int().min(1900).max(2200).optional(), semester: z.string().max(80).optional(), production: z.string().max(160).optional(), description: z.string().max(5000).optional(), tags: z.string().max(1000).optional(), confidentiality: z.enum(["PUBLIC", "INTERNAL", "EXECUTIVE", "RESTRICTED"]).optional(), version: z.string().max(40).optional() });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const item = await prisma.archiveItem.findFirst({ where: { id, deletedAt: null }, include: { versions: { orderBy: { createdAt: "desc" } }, uploadedBy: { select: { name: true } } } });
  if (!item) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageArchive(user.role)) return NextResponse.json({ error: "You do not have permission to edit archive metadata." }, { status: 403 });
  const body = metadataSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Enter valid archive metadata." }, { status: 400 });
  const { id } = await context.params;
  const current = await prisma.archiveItem.findFirst({ where: { id, deletedAt: null } });
  if (!current) return NextResponse.json({ error: "File not found." }, { status: 404 });
  await prisma.archiveVersion.create({ data: { archiveItemId: current.id, version: current.version || "Previous", fileName: current.fileName, storageName: current.storageName, mimeType: current.mimeType, size: current.size, metadata: JSON.stringify({ category: current.category, year: current.year, semester: current.semester, production: current.production, description: current.description, tags: current.tags, confidentiality: current.confidentiality }) } });
  const item = await prisma.archiveItem.update({ where: { id }, data: body.data });
  await prisma.auditLog.create({ data: { action: "metadata_changed", entity: "archive", entityId: id, metadata: JSON.stringify({ version: item.version }), userId: user.id } });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const crossSite = rejectCrossSiteRequest(_request);
  if (crossSite) return crossSite;
  const user = await getCurrentUser();
  if (!user || !canManageArchive(user.role)) return NextResponse.json({ error: "You do not have permission to remove archive items." }, { status: 403 });
  const { id } = await context.params;
  const item = await prisma.archiveItem.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { action: "recycled", entity: "archive", entityId: id, userId: user.id } });
  return NextResponse.json({ item });
}
