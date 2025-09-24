-- DropForeignKey
ALTER TABLE "public"."Thumbnails" DROP CONSTRAINT "Thumbnails_videoIdeaId_fkey";

-- AlterTable
ALTER TABLE "public"."Thumbnails" ALTER COLUMN "videoIdeaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Thumbnails" ADD CONSTRAINT "Thumbnails_videoIdeaId_fkey" FOREIGN KEY ("videoIdeaId") REFERENCES "public"."VideoIdeas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
