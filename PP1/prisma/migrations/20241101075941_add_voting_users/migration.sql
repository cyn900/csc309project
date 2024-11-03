-- CreateTable
CREATE TABLE "_Upvotes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_Upvotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Upvotes_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("uID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_Downvotes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_Downvotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Downvotes_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("uID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_Upvotes_AB_unique" ON "_Upvotes"("A", "B");

-- CreateIndex
CREATE INDEX "_Upvotes_B_index" ON "_Upvotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Downvotes_AB_unique" ON "_Downvotes"("A", "B");

-- CreateIndex
CREATE INDEX "_Downvotes_B_index" ON "_Downvotes"("B");
