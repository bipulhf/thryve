"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CritiqueData {
  response_text: string;
  "Overall Sentiment:": string;
  "Sentiment Breakdown": string;
  "Top Positive Themes": string[];
  "Top Negative Themes": string[];
  "Trend:": string;
}

export function CommentCritiqueDialog({
  open,
  onOpenChange,
  ytVideoId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ytVideoId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [critiqueData, setCritiqueData] = useState<CritiqueData | null>(null);

  const parseSentimentBreakdown = (breakdown: string) => {
    if (!breakdown || typeof breakdown !== "string") {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    const match = breakdown.match(
      /(\d+)% Positive \| (\d+)% Neutral \| (\d+)% Negative/
    );
    if (match) {
      return {
        positive: parseInt(match[1]) || 0,
        neutral: parseInt(match[2]) || 0,
        negative: parseInt(match[3]) || 0,
      };
    }
    return { positive: 0, neutral: 0, negative: 0 };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      case "neutral":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <ThumbsUp className="w-4 h-4" />;
      case "negative":
        return <ThumbsDown className="w-4 h-4" />;
      case "neutral":
        return <Minus className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const runCritique = async () => {
    if (!ytVideoId) return;
    try {
      setLoading(true);
      setCritiqueData(null);
      const resp = await fetch("/api/videos/comments/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yt_video_id: ytVideoId }),
      });
      const data = await resp.json();
      console.log(data);
      if (!resp.ok)
        throw new Error(data?.error || "Failed to analyze comments");

      // The API now returns structured data directly
      setCritiqueData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setCritiqueData(null);
    }
  }, [open]);

  const sentimentBreakdown = critiqueData
    ? parseSentimentBreakdown(critiqueData["Sentiment Breakdown"])
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Comment Analysis Dashboard
          </DialogTitle>
          <DialogDescription>
            Comprehensive analysis of your video comments with actionable
            insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!critiqueData && (
            <div className="flex justify-center py-8">
              <Button
                onClick={runCritique}
                disabled={loading || !ytVideoId}
                size="lg"
                className="px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing Comments...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          )}

          {critiqueData && (
            <>
              {/* Overall Sentiment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Overall Sentiment
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {String(critiqueData["Sentiment Breakdown"] || "")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sentimentBreakdown && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 font-medium">
                            Positive
                          </span>
                          <span>{sentimentBreakdown.positive}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${sentimentBreakdown.positive}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-600 font-medium">
                            Neutral
                          </span>
                          <span>{sentimentBreakdown.neutral}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${sentimentBreakdown.neutral}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600 font-medium">
                            Negative
                          </span>
                          <span>{sentimentBreakdown.negative}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${sentimentBreakdown.negative}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Themes Section */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Positive Themes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      Positive Themes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.isArray(critiqueData["Top Positive Themes"]) &&
                        critiqueData["Top Positive Themes"].map(
                          (theme, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="mr-2 mb-2 bg-green-100 text-green-800"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {String(theme)}
                            </Badge>
                          )
                        )}
                    </div>
                  </CardContent>
                </Card>

                {/* Negative Themes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="w-5 h-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.isArray(critiqueData["Top Negative Themes"]) &&
                        critiqueData["Top Negative Themes"].map(
                          (theme, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="mr-2 mb-2 bg-red-100 text-red-800"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {String(theme)}
                            </Badge>
                          )
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Detailed Analysis & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {String(critiqueData.response_text || "")}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={() => window.print()}>Export as PDF</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
