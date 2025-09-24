import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { getGoogleAccessToken } from "@/lib/clerk";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ownerChannelId = searchParams.get("ownerChannelId");
    if (!ownerChannelId) {
      return NextResponse.json(
        { error: "Missing ownerChannelId" },
        { status: 400 }
      );
    }

    // Ensure the owner channel belongs to the current user
    const ownerChannel = await prisma.channels.findUnique({
      where: {
        userId_channelId: { userId: user.id, channelId: ownerChannelId },
      },
    });
    if (!ownerChannel) {
      return NextResponse.json(
        { error: "Channel not found for current user" },
        { status: 404 }
      );
    }

    // Fetch similar channel ids (if any)
    const mappings = await prisma.similarChannels.findMany({
      where: { ownerChannelId },
      orderBy: { rank: "asc" },
      select: { similarChannelId: true },
    });

    const similarIds = mappings.map((m) => m.similarChannelId);
    if (similarIds.length === 0) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const token = await getGoogleAccessToken();
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    // YouTube API supports up to 50 ids per request
    const chunked: string[][] = [];
    for (let i = 0; i < similarIds.length; i += 50) {
      chunked.push(similarIds.slice(i, i + 50));
    }

    const results: Array<{
      id: string;
      title: string;
      description: string | null;
      thumbnail: string | null;
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    }> = [];

    for (const ids of chunked) {
      const resp = await youtube.channels.list({
        part: ["snippet", "statistics"],
        id: ids,
      });
      for (const c of resp.data.items || []) {
        results.push({
          id: c.id || "",
          title: c.snippet?.title || "",
          description: c.snippet?.description || null,
          thumbnail:
            c.snippet?.thumbnails?.high?.url ||
            c.snippet?.thumbnails?.default?.url ||
            null,
          subscriberCount: c.statistics?.subscriberCount || "0",
          videoCount: c.statistics?.videoCount || "0",
          viewCount: c.statistics?.viewCount || "0",
        });
      }
    }

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error("/api/channels/similar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
