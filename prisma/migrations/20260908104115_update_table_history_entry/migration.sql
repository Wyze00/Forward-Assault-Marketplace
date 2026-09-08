/*
  Warnings:

  - You are about to alter the column `offerID` on the `SkinHistoryEntry` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `sellerID` on the `SkinHistoryEntry` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `skinID` on the `SkinHistoryEntry` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SkinHistoryEntry" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinHistoryUuid" TEXT NOT NULL,
    "offerID" INTEGER NOT NULL,
    "sellerID" INTEGER NOT NULL,
    "sellerName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" REAL NOT NULL,
    "skinID" INTEGER NOT NULL,
    "listingDate" TEXT NOT NULL,
    CONSTRAINT "SkinHistoryEntry_skinHistoryUuid_fkey" FOREIGN KEY ("skinHistoryUuid") REFERENCES "SkinHistory" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SkinHistoryEntry" ("condition", "listingDate", "offerID", "price", "sellerID", "sellerName", "skinHistoryUuid", "skinID", "uuid") SELECT "condition", "listingDate", "offerID", "price", "sellerID", "sellerName", "skinHistoryUuid", "skinID", "uuid" FROM "SkinHistoryEntry";
DROP TABLE "SkinHistoryEntry";
ALTER TABLE "new_SkinHistoryEntry" RENAME TO "SkinHistoryEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
