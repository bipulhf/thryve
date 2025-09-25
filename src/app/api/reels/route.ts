import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/clerk";
import { deductCredits } from "@/lib/credit-utils";

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

    // Fetch reels for the channel with their assets
    const reels = await prisma.reels.findMany({
      where: {
        channelId,
      },
      include: {
        reelAssets: {
          orderBy: {
            createdAt: "asc",
          },
        },
        videoIdea: {
          select: {
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      reels: reels.map((reel) => ({
        id: reel.id,
        generatorId: reel.generatorId,
        status: reel.status,
        channelId: reel.channelId,
        title: reel.title,
        description: reel.description,
        url: reel.url,
        videoIdeaId: reel.videoIdeaId,
        videoIdea: reel.videoIdea,
        reelAssets: reel.reelAssets.map((asset) => ({
          id: asset.id,
          generatorId: asset.generatorId,
          status: asset.status,
          url: asset.url,
          assetType: asset.assetType,
          createdAt: asset.createdAt.toISOString(),
          updatedAt: asset.updatedAt.toISOString(),
        })),
        createdAt: reel.createdAt.toISOString(),
        updatedAt: reel.updatedAt.toISOString(),
      })),
      totalReels: reels.length,
    });
  } catch (error) {
    console.error("/api/reels GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { channelId, title, description, videoIdeaId, prompt, imageUrls } =
      body || {};

    if (!channelId || !title) {
      return NextResponse.json(
        { error: "channelId and title are required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to user
    const channel = await prisma.channels.findUnique({ where: { channelId } });
    if (!channel || channel.userId !== userId) {
      return NextResponse.json({ error: "Invalid channelId" }, { status: 404 });
    }

    // Deduct credits atomically
    const creditResult = await deductCredits(userId, "REEL_GENERATE");
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    // Call SMYTHOS_AGENT1/Reels_Making if prompt and imageUrls are provided
    let requestId: string | null = null;
    if (prompt && imageUrls && imageUrls.length > 0) {
      const targetUrl = process.env.SMYTHOS_AGENT1;
      if (!targetUrl) {
        return NextResponse.json(
          { error: "SMYTHOS_AGENT1 is not configured" },
          { status: 500 }
        );
      }

      const payload = {
        prompt,
        image_urls: imageUrls,
        fal_webhook: process.env.FAL_WEBHOOK || "",
      } as const;

      const resp = await fetch(targetUrl + "/Reels_Making", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const respText = await resp.json();

      if (!resp.ok) {
        return NextResponse.json(
          { error: "External agent error", details: respText },
          { status: 502 }
        );
      }

      let data: any = null;
      try {
        data = respText;
      } catch {
        // non-JSON response; return raw text
        data = { message: respText };
      }

      requestId = data?.result?.Response?.request_id;
      if (!requestId) {
        return NextResponse.json(
          { error: "Missing request_id in external response" },
          { status: 502 }
        );
      }
    }

    // Create the reel
    const createdReel = await prisma.reels.create({
      data: {
        generatorId: requestId || `reel_${crypto.randomUUID()}`,
        status: requestId ? "PROCESSING" : "COMPLETED",
        channelId,
        title,
        description,
        videoIdeaId: videoIdeaId || null,
        url: requestId ? null : undefined, // Will be updated when processing completes if using external service
      },
      select: { id: true, generatorId: true },
    });

    // Create reel assets for uploaded media
    if (imageUrls && imageUrls.length > 0) {
      const reelAssets = imageUrls.map((mediaUrl: string) => {
        // Determine asset type based on URL extension
        const isVideo =
          mediaUrl.includes(".mp4") ||
          mediaUrl.includes(".webm") ||
          mediaUrl.includes(".mov") ||
          mediaUrl.includes(".avi");

        return {
          reelId: createdReel.id,
          generatorId: `reel_asset_${crypto.randomUUID()}`,
          status: "PROCESSING" as const,
          url: mediaUrl,
          assetType: isVideo ? "mp4" : "image",
        };
      });

      await prisma.reelAssets.createMany({
        data: reelAssets,
      });
    }

    return NextResponse.json({
      success: true,
      id: createdReel.id,
      generatorId: createdReel.generatorId,
      requestId,
    });
  } catch (error) {
    console.error("/api/reels POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
