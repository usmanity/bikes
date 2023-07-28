-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "initialPrice" REAL NOT NULL,
    "photo" TEXT,
    "acquireDate" DATETIME,
    "bikeType" TEXT NOT NULL DEFAULT 'road',
    "milesAtAcquire" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bike" ("acquireDate", "brand", "createdAt", "id", "initialPrice", "milesAtAcquire", "model", "name", "photo", "updatedAt") SELECT "acquireDate", "brand", "createdAt", "id", "initialPrice", "milesAtAcquire", "model", "name", "photo", "updatedAt" FROM "Bike";
DROP TABLE "Bike";
ALTER TABLE "new_Bike" RENAME TO "Bike";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
