-- AlterTable
ALTER TABLE "public"."Assests" ALTER COLUMN "url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."ReelAssets" ALTER COLUMN "url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Reels" ADD COLUMN     "url" TEXT;
