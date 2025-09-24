/*
  Warnings:

  - You are about to drop the column `description` on the `Thumbnails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Thumbnails" DROP COLUMN "description",
ALTER COLUMN "title" DROP NOT NULL;
