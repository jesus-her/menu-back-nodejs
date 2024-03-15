-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_storeid_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "storeid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_storeid_fkey" FOREIGN KEY ("storeid") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
