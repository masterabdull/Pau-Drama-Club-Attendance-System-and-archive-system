import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({ needsSetup: (await prisma.user.count()) === 0 });
}
