import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { channelId, url, assetType, title, description } = body || {};
    if (!channelId || !url || !assetType) {
      return NextResponse.json(
        { error: "channelId, url, assetType required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const channel = await prisma.channels.findUnique({ where: { channelId } });
    if (!channel || channel.userId !== userId) {
      return NextResponse.json({ error: "Invalid channelId" }, { status: 404 });
    }

    const created = await prisma.assests.create({
      data: {
        generatorId: `upl_${crypto.randomUUID()}`,
        status: "COMPLETED",
        channelId,
        url,
        assetType,
        // title/description are not in Assests; they can be saved in related models later
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id });
  } catch (error) {
    console.error("/api/assets POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
