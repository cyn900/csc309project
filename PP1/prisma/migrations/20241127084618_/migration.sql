-- CreateTable
CREATE TABLE "User" (
    "uID" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "phoneNum" INTEGER,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uID")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "tID" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "code" TEXT,
    "fork" BOOLEAN NOT NULL,
    "uID" INTEGER NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("tID")
);

-- CreateTable
CREATE TABLE "Blog" (
    "bID" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "uID" INTEGER NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("bID")
);

-- CreateTable
CREATE TABLE "Comment" (
    "cID" SERIAL NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "uID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "pID" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("cID")
);

-- CreateTable
CREATE TABLE "CommentReport" (
    "crID" SERIAL NOT NULL,
    "explanation" TEXT NOT NULL,
    "cID" INTEGER NOT NULL,
    "uID" INTEGER NOT NULL,

    CONSTRAINT "CommentReport_pkey" PRIMARY KEY ("crID")
);

-- CreateTable
CREATE TABLE "BlogReport" (
    "brID" SERIAL NOT NULL,
    "explanation" TEXT NOT NULL,
    "bID" INTEGER NOT NULL,
    "uID" INTEGER NOT NULL,

    CONSTRAINT "BlogReport_pkey" PRIMARY KEY ("brID")
);

-- CreateTable
CREATE TABLE "_TemplateTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_BlogTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_BlogTemplates" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_Upvotes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_Downvotes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_UpvotesComment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_DownvotesComment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_value_key" ON "Tag"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Template_title_key" ON "Template"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_title_key" ON "Blog"("title");

-- CreateIndex
CREATE UNIQUE INDEX "_TemplateTags_AB_unique" ON "_TemplateTags"("A", "B");

-- CreateIndex
CREATE INDEX "_TemplateTags_B_index" ON "_TemplateTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogTags_AB_unique" ON "_BlogTags"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogTags_B_index" ON "_BlogTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogTemplates_AB_unique" ON "_BlogTemplates"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogTemplates_B_index" ON "_BlogTemplates"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Upvotes_AB_unique" ON "_Upvotes"("A", "B");

-- CreateIndex
CREATE INDEX "_Upvotes_B_index" ON "_Upvotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Downvotes_AB_unique" ON "_Downvotes"("A", "B");

-- CreateIndex
CREATE INDEX "_Downvotes_B_index" ON "_Downvotes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UpvotesComment_AB_unique" ON "_UpvotesComment"("A", "B");

-- CreateIndex
CREATE INDEX "_UpvotesComment_B_index" ON "_UpvotesComment"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DownvotesComment_AB_unique" ON "_DownvotesComment"("A", "B");

-- CreateIndex
CREATE INDEX "_DownvotesComment_B_index" ON "_DownvotesComment"("B");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User"("uID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User"("uID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User"("uID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog"("bID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_pID_fkey" FOREIGN KEY ("pID") REFERENCES "Comment"("cID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_cID_fkey" FOREIGN KEY ("cID") REFERENCES "Comment"("cID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User"("uID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReport" ADD CONSTRAINT "BlogReport_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog"("bID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReport" ADD CONSTRAINT "BlogReport_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User"("uID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateTags" ADD CONSTRAINT "_TemplateTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateTags" ADD CONSTRAINT "_TemplateTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Template"("tID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogTags" ADD CONSTRAINT "_BlogTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog"("bID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogTags" ADD CONSTRAINT "_BlogTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogTemplates" ADD CONSTRAINT "_BlogTemplates_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog"("bID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogTemplates" ADD CONSTRAINT "_BlogTemplates_B_fkey" FOREIGN KEY ("B") REFERENCES "Template"("tID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Upvotes" ADD CONSTRAINT "_Upvotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog"("bID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Upvotes" ADD CONSTRAINT "_Upvotes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("uID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Downvotes" ADD CONSTRAINT "_Downvotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog"("bID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Downvotes" ADD CONSTRAINT "_Downvotes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("uID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UpvotesComment" ADD CONSTRAINT "_UpvotesComment_A_fkey" FOREIGN KEY ("A") REFERENCES "Comment"("cID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UpvotesComment" ADD CONSTRAINT "_UpvotesComment_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("uID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DownvotesComment" ADD CONSTRAINT "_DownvotesComment_A_fkey" FOREIGN KEY ("A") REFERENCES "Comment"("cID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DownvotesComment" ADD CONSTRAINT "_DownvotesComment_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("uID") ON DELETE CASCADE ON UPDATE CASCADE;
