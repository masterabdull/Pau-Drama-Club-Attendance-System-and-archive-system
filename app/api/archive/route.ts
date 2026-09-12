import { NextResponse } from "next/server";
import type { Confidentiality } from "@prisma/client";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { archiveScope, canManageArchive } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const search = params.get("search") || "";
  const year = params.get("year");
  const category = params.get("category");
  const scope = archiveScope(user.role);
  const visibility: { in: Confidentiality[] } | undefined = scope === "all" ? undefined : scope === "public" ? { in: ["PUBLIC"] } : { in: ["PUBLIC", "INTERNAL", "EXECUTIVE"] };
  const terms = scope === "musical" ? ["musical", "music"] : scope === "drama" ? ["drama"] : scope === "publicity" ? ["publicity", "promotion", "marketing"] : scope === "drama-musical" ? ["drama", "musical", "music"] : [];
  const searchMatch = [{ fileName: { contains: search } }, { production: { contains: search } }, { category: { contains: search } }, { tags: { contains: search } }, { description: { contains: search } }];
  const scopeMatch = terms.flatMap((term) => [{ fileName: { contains: term } }, { production: { contains: term } }, { category: { contains: term } }, { tags: { contains: term } }, { description: { contains: term } }]);
  const items = await prisma.archiveItem.findMany({ where: { deletedAt: null, ...(visibility ? { confidentiality: visibility } : {}), ...(year ? { year: Number(year) } : {}), ...(category && category !== "All" ? { category } : {}), AND: [{ OR: searchMatch }, ...(scopeMatch.length ? [{ OR: scopeMatch }] : [])] }, orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { name: true } } } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !canManageArchive(user.role)) return NextResponse.json({ error: "You do not have permission to upload archive items." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  const year = Number(form.get("year") || new Date().getFullYear());
  const storageName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  let storedName = storageName;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(storageName, file, { access: "private", addRandomSuffix: false });
    storedName = blob.pathname;
  } else {
    const storageDirectory = process.env.ARCHIVE_STORAGE_DIR || path.join(process.cwd(), "storage");
    await mkdir(storageDirectory, { recursive: true });
    await writeFile(path.join(storageDirectory, storageName), Buffer.from(await file.arrayBuffer()));
  }
  const item = await prisma.archiveItem.create({ data: { fileName: file.name, storageName: storedName, mimeType: file.type || "application/octet-stream", size: file.size, category: String(form.get("category") || "Other"), year: Number.isFinite(year) ? year : new Date().getFullYear(), semester: String(form.get("semester") || ""), production: String(form.get("production") || ""), description: String(form.get("description") || ""), tags: String(form.get("tags") || ""), confidentiality: (String(form.get("confidentiality") || "INTERNAL") as "PUBLIC" | "INTERNAL" | "EXECUTIVE" | "RESTRICTED"), version: String(form.get("version") || "Final"), uploadedById: user.id } });
  await prisma.auditLog.create({ data: { action: "uploaded", entity: "archive", entityId: item.id, metadata: JSON.stringify({ fileName: item.fileName }), userId: user.id } });
  return NextResponse.json({ item }, { status: 201 });
}
