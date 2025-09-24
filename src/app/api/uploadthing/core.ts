import { createUploadthing, type FileRouter } from "uploadthing/next";
import { requireUserId } from "@/lib/clerk";

const f = createUploadthing();

export const appFileRouter = {
  thumbnailImage: f({ image: { maxFileSize: "2MB", maxFileCount: 4 } })
    .middleware(async () => {
      const userId = await requireUserId();
      return { userId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      // Return info needed by client to post-process (e.g., create DB record)
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        fileKey: file.key,
      };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof appFileRouter;
