import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { get } from "@vercel/blob";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { archiveScope } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const item = await prisma.archiveItem.findFirst({ where: { id, deletedAt: null } });
  if (!item) return NextResponse.json({ error: "File not found." }, { status: 404 });
  const scope = archiveScope(user.role);
  const text = [item.fileName, item.category, item.production, item.tags, item.description].filter(Boolean).join(" ").toLowerCase();
  const scoped = scope === "all" || scope === "public" || (scope === "musical" && (text.includes("musical") || text.includes("music"))) || (scope === "drama" && text.includes("drama")) || (scope === "publicity" && ["publicity", "promotion", "marketing"].some((term) => text.includes(term))) || (scope === "drama-musical" && ["drama", "musical", "music"].some((term) => text.includes(term)));
  const access = scope === "all" || item.confidentiality === "PUBLIC" || (item.confidentiality !== "RESTRICTED" && scope !== "public" && scoped);
  if (!access) return NextResponse.json({ error: "You do not have access to this file." }, { status: 403 });
  try {
    let body: BodyInit;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await get(item.storageName, { access: "private" });
      if (!blob?.stream) return NextResponse.json({ error: "Stored file is unavailable." }, { status: 404 });
      body = blob.stream;
    } else {
      const storageDirectory = process.env.ARCHIVE_STORAGE_DIR || path.join(process.cwd(), "storage");
      body = Buffer.from(await readFile(path.join(storageDirectory, item.storageName)));
    }
    await prisma.auditLog.create({ data: { action: "downloaded", entity: "archive", entityId: item.id, userId: user.id } });
    return new NextResponse(body, { headers: { "Content-Type": item.mimeType, "Content-Disposition": `inline; filename="${item.fileName.replace(/"/g, "")}"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Stored file is unavailable." }, { status: 404 });
  }
}
