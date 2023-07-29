-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "bikeId" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "updatedAt" DATETIME NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active'
);
INSERT INTO "new_Bike" ("acquireDate", "bikeType", "brand", "createdAt", "description", "id", "initialPrice", "milesAtAcquire", "model", "name", "photo", "updatedAt") SELECT "acquireDate", "bikeType", "brand", "createdAt", "description", "id", "initialPrice", "milesAtAcquire", "model", "name", "photo", "updatedAt" FROM "Bike";
DROP TABLE "Bike";
ALTER TABLE "new_Bike" RENAME TO "Bike";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
