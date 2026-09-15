-- CreateTable
CREATE TABLE "CategorySettings" (
    "category" TEXT NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "CategorySettings_pkey" PRIMARY KEY ("category")
);
