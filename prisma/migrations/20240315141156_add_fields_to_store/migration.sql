/*
  Warnings:

  - Added the required column `logoUrl` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "address" TEXT,
ADD COLUMN     "igUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;
