-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogReport" (
    "brID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "explanation" TEXT NOT NULL,
    "bID" INTEGER NOT NULL,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "BlogReport_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogReport_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BlogReport" ("bID", "brID", "explanation", "uID") SELECT "bID", "brID", "explanation", "uID" FROM "BlogReport";
DROP TABLE "BlogReport";
ALTER TABLE "new_BlogReport" RENAME TO "BlogReport";
CREATE TABLE "new_Comment" (
    "cID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hidden" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "uID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "pID" INTEGER,
    "upvote" INTEGER NOT NULL,
    "downvote" INTEGER NOT NULL,
    CONSTRAINT "Comment_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_pID_fkey" FOREIGN KEY ("pID") REFERENCES "Comment" ("cID") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("bID", "cID", "content", "downvote", "hidden", "pID", "uID", "upvote") SELECT "bID", "cID", "content", "downvote", "hidden", "pID", "uID", "upvote" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
