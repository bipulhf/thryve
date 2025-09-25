import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingImage = {
  url?: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
};

type IncomingBody = {
  request_id?: string;
  gateway_request_id?: string;
  status?: string;
  payload?: {
    images?: IncomingImage[];
    seed?: number | string;
    audio?: IncomingImage[];
    video?: IncomingImage[];
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IncomingBody;

    console.log(body);
    const requestId = body?.request_id || body?.gateway_request_id;
    if (!requestId) {
      return NextResponse.json(
        { error: "request_id is required" },
        { status: 400 }
      );
    }

    const imageUrl =
      body?.payload?.images?.[0]?.url ||
      body?.payload?.video?.[0]?.url ||
      body?.payload?.audio?.[0]?.url;
    const isOk = (body?.status || "").toUpperCase() === "OK";
    const newStatus = isOk ? "COMPLETED" : "FAILED";

    // Try to update in order: Thumbnails, Reels, ReelAssets, Assests
    // Each model has unique generatorId according to schema.
    let updated = false;

    // Thumbnails
    try {
      const thumb = await prisma.thumbnails.update({
        where: { generatorId: requestId },
        data: {
          status: newStatus as any,
          ...(imageUrl ? { url: imageUrl } : {}),
        },
        select: { id: true },
      });
      if (thumb) updated = true;
    } catch {}

    if (!updated) {
      // Reels
      try {
        const reel = await prisma.reels.update({
          where: { generatorId: requestId },
          data: {
            status: newStatus as any,
            ...(imageUrl ? { url: imageUrl } : {}),
          },
          select: { id: true },
        });
        if (reel) updated = true;
      } catch {}
    }

    if (!updated) {
      // ReelAssets
      try {
        const reelAsset = await prisma.reelAssets.update({
          where: { generatorId: requestId },
          data: {
            status: newStatus as any,
            ...(imageUrl ? { url: imageUrl } : {}),
          },
          select: { id: true },
        });
        if (reelAsset) updated = true;
      } catch {}
    }

    if (!updated) {
      // Assests
      try {
        const asset = await prisma.assests.update({
          where: { generatorId: requestId },
          data: {
            status: newStatus as any,
            ...(imageUrl ? { url: imageUrl } : {}),
          },
          select: { id: true },
        });
        if (asset) updated = true;
      } catch {}
    }

    if (!updated) {
      console.log("No matching record found for request_id", requestId);
      return NextResponse.json(
        { error: "No matching record found for request_id" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/webhook POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
