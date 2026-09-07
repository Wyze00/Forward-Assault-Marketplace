-- CreateTable
CREATE TABLE "Camo" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "itemType" TEXT NOT NULL,
    "camoID" INTEGER NOT NULL,
    "camoName" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Weapon" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "weaponType" INTEGER NOT NULL,
    "weaponName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Skin" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "camoUuid" TEXT NOT NULL,
    "weaponType" INTEGER NOT NULL,
    CONSTRAINT "Skin_camoUuid_fkey" FOREIGN KEY ("camoUuid") REFERENCES "Camo" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Skin_weaponType_fkey" FOREIGN KEY ("weaponType") REFERENCES "Weapon" ("weaponType") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkinHistory" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinUuid" TEXT NOT NULL,
    "offerID" TEXT NOT NULL,
    "sellerID" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "listingDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkinHistory_skinUuid_fkey" FOREIGN KEY ("skinUuid") REFERENCES "Skin" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FavoriteSkin" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinUuid" TEXT NOT NULL,
    CONSTRAINT "FavoriteSkin_skinUuid_fkey" FOREIGN KEY ("skinUuid") REFERENCES "Skin" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Camo_itemType_camoID_key" ON "Camo"("itemType", "camoID");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_weaponType_key" ON "Weapon"("weaponType");

-- CreateIndex
CREATE UNIQUE INDEX "Skin_camoUuid_weaponType_key" ON "Skin"("camoUuid", "weaponType");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteSkin_skinUuid_key" ON "FavoriteSkin"("skinUuid");
