-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_symbol_key" ON "Favorite"("symbol");
