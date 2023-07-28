/*
  Warnings:

  - Added the required column `installationDate` to the `Component` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bike" ADD COLUMN "acquireDate" DATETIME;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Component" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "bikeId" INTEGER NOT NULL,
    "milesAtInstall" REAL NOT NULL,
    "installationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Component_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Component" ("bikeId", "brand", "cost", "createdAt", "id", "milesAtInstall", "name", "updatedAt") SELECT "bikeId", "brand", "cost", "createdAt", "id", "milesAtInstall", "name", "updatedAt" FROM "Component";
DROP TABLE "Component";
ALTER TABLE "new_Component" RENAME TO "Component";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
