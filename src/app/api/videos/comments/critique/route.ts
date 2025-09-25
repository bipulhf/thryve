import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const yt_video_id: string | undefined = body?.yt_video_id;
    if (!yt_video_id) {
      return NextResponse.json(
        { error: "yt_video_id is required" },
        { status: 400 }
      );
    }

    const agentBase = process.env.SMYTHOS_AGENT2;
    if (!agentBase) {
      return NextResponse.json(
        { error: "SMYTHOS_AGENT2 is not configured" },
        { status: 500 }
      );
    }

    const payload = {
      Prompt:
        "Analyze the following YouTube video comments carefully. Identify the actual issues viewers are pointing out with my videos. Go beyond surface-level sentiment (like 'good video' or 'bad video') and focus on constructive criticism or recurring complaints. Highlight specific problems related to video quality (audio, visuals, editing, pacing), content quality (clarity, depth, accuracy, usefulness), presentation (tone, energy, communication style), or technical issues (length, captions, accessibility, clickbait). Provide me with a clear breakdown of the issues mentioned, patterns across multiple comments, and actionable suggestions I can use to improve my future videos.",
      yt_video_id,
    } as const;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    let resp: Response;
    try {
      resp = await fetch(agentBase + "/Analyze_Single_Video_Comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json(
        { error: "External agent error", details: data },
        { status: 502 }
      );
    }

    const reply = data?.result?.Output?.reply || "";

    // Try to parse the reply as JSON, if it fails, return as text
    try {
      const parsedData = reply;

      // Ensure all values are properly serialized strings or arrays
      const sanitizedData = {
        response_text:
          typeof parsedData.response_text === "string"
            ? parsedData.response_text
            : JSON.stringify(parsedData.response_text || ""),
        "Overall Sentiment:":
          typeof parsedData["Overall Sentiment:"] === "string"
            ? parsedData["Overall Sentiment:"]
            : "Unknown",
        "Sentiment Breakdown":
          typeof parsedData["Sentiment Breakdown"] === "string"
            ? parsedData["Sentiment Breakdown"]
            : "0% Positive | 0% Neutral | 0% Negative",
        "Top Positive Themes": Array.isArray(parsedData["Top Positive Themes"])
          ? parsedData["Top Positive Themes"]
          : [],
        "Top Negative Themes": Array.isArray(parsedData["Top Negative Themes"])
          ? parsedData["Top Negative Themes"]
          : [],
        "Trend:":
          typeof parsedData["Trend:"] === "string"
            ? parsedData["Trend:"]
            : "Analysis completed",
      };

      return NextResponse.json(sanitizedData);
    } catch {
      // If not JSON, return as structured text response
      return NextResponse.json({
        response_text: reply,
        "Overall Sentiment:": "Unknown",
        "Sentiment Breakdown": "0% Positive | 0% Neutral | 0% Negative",
        "Top Positive Themes": [],
        "Top Negative Themes": [],
        "Trend:": "Analysis completed",
      });
    }
  } catch (error) {
    console.error("/api/videos/comments/critique error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
