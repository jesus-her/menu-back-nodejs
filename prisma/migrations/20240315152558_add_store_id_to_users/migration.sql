/*
  Warnings:

  - You are about to drop the column `storeid` on the `user` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_storeid_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "storeid",
ADD COLUMN     "storeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
