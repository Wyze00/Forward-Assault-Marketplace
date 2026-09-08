/*
  Warnings:

  - You are about to drop the column `listingDate` on the `SkinHistory` table. All the data in the column will be lost.
  - You are about to drop the column `offerID` on the `SkinHistory` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `SkinHistory` table. All the data in the column will be lost.
  - You are about to drop the column `sellerID` on the `SkinHistory` table. All the data in the column will be lost.
  - You are about to drop the column `sellerName` on the `SkinHistory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[camoUuid]` on the table `Skin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[weaponType]` on the table `Skin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "SkinHistoryEntry" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinHistoryUuid" TEXT NOT NULL,
    "offerID" TEXT NOT NULL,
    "sellerID" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "listingDate" TEXT NOT NULL,
    CONSTRAINT "SkinHistoryEntry_skinHistoryUuid_fkey" FOREIGN KEY ("skinHistoryUuid") REFERENCES "SkinHistory" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SkinHistory" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinUuid" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkinHistory_skinUuid_fkey" FOREIGN KEY ("skinUuid") REFERENCES "Skin" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SkinHistory" ("createdAt", "skinUuid", "uuid") SELECT "createdAt", "skinUuid", "uuid" FROM "SkinHistory";
DROP TABLE "SkinHistory";
ALTER TABLE "new_SkinHistory" RENAME TO "SkinHistory";
CREATE UNIQUE INDEX "SkinHistory_skinUuid_key" ON "SkinHistory"("skinUuid");
CREATE UNIQUE INDEX "SkinHistory_createdAt_key" ON "SkinHistory"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Skin_camoUuid_key" ON "Skin"("camoUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Skin_weaponType_key" ON "Skin"("weaponType");
