import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const channel = await prisma.channels.findUnique({
      where: { channelId },
    });

    if (!channel || channel.userId !== userId) {
      return NextResponse.json({ error: "Invalid channelId" }, { status: 404 });
    }

    // Fetch audio assets (mp3 type) for the channel
    const assets = await prisma.assests.findMany({
      where: {
        channelId,
        assetType: "mp3", // Filter for audio files
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      assets: assets.map((asset) => ({
        id: asset.id,
        generatorId: asset.generatorId,
        status: asset.status,
        channelId: asset.channelId,
        url: asset.url,
        assetType: asset.assetType,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
      })),
      totalAssets: assets.length,
    });
  } catch (error) {
    console.error("/api/assets/audio GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
