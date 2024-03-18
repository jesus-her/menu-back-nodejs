-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
