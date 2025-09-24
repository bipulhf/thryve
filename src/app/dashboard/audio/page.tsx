"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Music,
  Play,
  Pause,
  Download,
  Upload,
  Mic,
  FileText,
  Youtube,
} from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@uploadthing/react";
import type { AppFileRouter } from "@/app/api/uploadthing/core";
import { toast } from "sonner";
import { UploadButton } from "@/utils/uploadthing";

interface Channel {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

interface ChannelsResponse {
  channels: Channel[];
  totalChannels: number;
}

interface AudioAsset {
  id: string;
  generatorId: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  channelId: string;
  url: string | null;
  assetType: string;
  createdAt: string;
  updatedAt: string;
}

interface AudioAssetsResponse {
  assets: AudioAsset[];
  totalAssets: number;
}

export default function AudioGenerationPage() {
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(
    null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [speechText, setSpeechText] = useState("");
  const [voiceSampleUrl, setVoiceSampleUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    const loadMyChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/channels/check");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load channels");
        if (!data.hasChannels) {
          setChannelsData({ channels: [], totalChannels: 0 });
          setSelectedChannelId(null);
          return;
        }
        const mapped: ChannelsResponse = {
          channels: (data.channels || []).map((c: any) => ({
            id: c.channelId,
            title: c.title,
            description: c.description,
            thumbnail: c.thumbnail,
            subscriberCount: String(c.subscriberCount ?? "0"),
            videoCount: String(c.videoCount ?? "0"),
            viewCount: String(c.viewCount ?? "0"),
          })),
          totalChannels: (data.channels || []).length,
        };
        setChannelsData(mapped);
        if (mapped.channels.length > 0) {
          setSelectedChannelId(mapped.channels[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    loadMyChannels();
  }, []);

  useEffect(() => {
    const fetchAudioAssets = async () => {
      if (!selectedChannelId) return;
      try {
        setAudioLoading(true);
        setError(null);
        const res = await fetch(
          `/api/assets/audio?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load audio assets");
        setAudioAssets(data.assets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setAudioLoading(false);
      }
    };
    fetchAudioAssets();
  }, [selectedChannelId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
    if (number >= 1000) return (number / 1000).toFixed(1) + "K";
    return number.toString();
  };

  const handlePlayPause = (assetId: string, url: string) => {
    if (playingAudio === assetId) {
      setPlayingAudio(null);
      // Stop audio logic here
    } else {
      setPlayingAudio(assetId);
      // Play audio logic here
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingAudio(null);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateSpeech = async () => {
    if (!speechText.trim() || !voiceSampleUrl || !selectedChannelId) {
      toast.error("Please provide both speech text and voice sample");
      return;
    }

    try {
      setUploading(true);
      const res = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          text: speechText.trim(),
          refAudioUrl: voiceSampleUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate speech");
      }

      toast.success(
        "Speech generation started! It will appear in your audio assets when ready."
      );
      setGenerateModalOpen(false);
      setSpeechText("");
      setVoiceSampleUrl(null);

      // Refresh the audio assets list
      if (selectedChannelId) {
        const refreshRes = await fetch(
          `/api/assets/audio?channelId=${encodeURIComponent(selectedChannelId)}`
        );
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setAudioAssets(refreshData.assets || []);
        }
      }
    } catch (err) {
      console.error("Speech generation error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate speech"
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingPage
          message="Loading your YouTube channels..."
          fullScreen={false}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Channel Selection */}
        {channelsData?.channels && channelsData?.channels.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Youtube className="h-6 w-6" />
                    <span>Your Channels</span>
                  </CardTitle>
                  <CardDescription>
                    Pick a channel to view processed audio assets
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channelsData?.channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedChannelId === channel.id
                        ? "ring-2 ring-primary bg-primary/10"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={channel.thumbnail || undefined}
                            alt={channel.title}
                          />
                          <AvatarFallback>
                            {channel.title?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-1">
                            {channel.title}
                          </CardTitle>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Music className="h-3 w-3 mr-1" />
                              {formatNumber(channel.subscriberCount)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {formatNumber(channel.videoCount)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Assets */}
        {selectedChannelId && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Music className="h-6 w-6" />
                    <span>Processed Audio</span>
                  </CardTitle>
                  <CardDescription>
                    {audioLoading
                      ? "Loading audio assets..."
                      : audioAssets.length === 0
                      ? "No processed audio files yet"
                      : `${audioAssets.length} processed audio file${
                          audioAssets.length === 1 ? "" : "s"
                        } found`}
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setGenerateModalOpen(true)}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Generate Speech
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {audioLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                  <LoadingPage
                    message="Loading audio assets..."
                    fullScreen={false}
                  />
                </div>
              ) : audioAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[36vh] text-center space-y-3">
                  <div className="text-base font-medium">
                    No processed audio files yet
                  </div>
                  <div className="text-sm text-black/60 max-w-md">
                    Upload audio files and they will appear here once processed.
                    You can also generate speech using AI.
                  </div>
                  <Button
                    onClick={() => setGenerateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Generate Speech
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {audioAssets.map((asset) => (
                    <Card
                      key={asset.id}
                      className="p-4 flex flex-col space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Music className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {asset.assetType === "mp3"
                                ? "Audio File"
                                : asset.assetType}
                            </div>
                            <div className="text-xs text-black/60">
                              {formatDate(asset.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            asset.status === "COMPLETED"
                              ? "default"
                              : asset.status === "PROCESSING"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {asset.status}
                        </Badge>
                      </div>

                      {asset.status === "COMPLETED" && asset.url && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handlePlayPause(asset.id, asset.url!)
                            }
                            className="flex-1"
                          >
                            {playingAudio === asset.id ? (
                              <Pause className="h-4 w-4 mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            {playingAudio === asset.id ? "Pause" : "Play"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                asset.url!,
                                `audio-${asset.id}.mp3`
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generate Speech Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mic className="h-5 w-5" />
              <span>Generate Speech</span>
            </DialogTitle>
            <DialogDescription>
              Upload a voice sample and enter the text you want to convert to
              speech.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="speech-text">Speech Text</Label>
              <Textarea
                id="speech-text"
                placeholder="Enter the text you want to convert to speech..."
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label>Voice Sample</Label>
              {voiceSampleUrl ? (
                <div className="mt-2 p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      Voice sample uploaded successfully
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <UploadButton
                    endpoint="audioFile"
                    onUploadBegin={() => {
                      toast.info("Uploading audio...");
                    }}
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setVoiceSampleUrl(res[0].ufsUrl);
                        toast.success("Voice sample uploaded successfully");
                      }
                    }}
                    onUploadError={(error) => {
                      console.error(error);
                      toast.error("Failed to upload voice sample");
                    }}
                    appearance={{
                      button:
                        "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                      clearBtn:
                        "bg-[#ec9347]! hover:bg-[#ec9347]/90! text-[#2d2d2b]! p-0 m-0 text-sm rounded-md",
                    }}
                    content={{
                      button: "Choose Files",
                      allowedContent: "Audio up to 8MB",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleGenerateSpeech}
              disabled={!speechText.trim() || !voiceSampleUrl || uploading}
            >
              {uploading ? "Generating..." : "Generate Speech"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
