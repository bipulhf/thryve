/*
  Warnings:

  - Added the required column `relevance_score` to the `SimilarChannels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SimilarChannels" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "relevance_score" TEXT NOT NULL;
