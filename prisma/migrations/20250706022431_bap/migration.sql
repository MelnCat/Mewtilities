-- CreateTable
CREATE TABLE "BapEntry" (
    "id" INTEGER NOT NULL,
    "subscribed" TEXT[],

    CONSTRAINT "BapEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCat" (
    "id" INTEGER NOT NULL,
    "ownerName" TEXT,
    "ownerId" INTEGER,
    "travelling" BOOLEAN NOT NULL,
    "location" TEXT NOT NULL,
    "genetic" TEXT,
    "name" TEXT NOT NULL,
    "wind" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "clothing" INTEGER[],
    "birthYear" INTEGER NOT NULL,
    "birthSeason" "Season" NOT NULL,
    "birthDay" INTEGER NOT NULL,
    "pronouns" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "sizeLb" DOUBLE PRECISION NOT NULL,
    "sizeKg" DOUBLE PRECISION NOT NULL,
    "fur" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "whiteMarks" TEXT NOT NULL,
    "accentColor" TEXT,
    "eyeColor" TEXT NOT NULL,
    "ageType" TEXT NOT NULL,
    "ageNumber" TEXT NOT NULL,
    "trinketId" INTEGER,
    "job" TEXT,
    "jobXp" JSONB,
    "class" TEXT,
    "classXp" JSONB,
    "strength" INTEGER,
    "agility" INTEGER,
    "health" INTEGER,
    "finesse" INTEGER,
    "cleverness" INTEGER,
    "perception" INTEGER,
    "luck" INTEGER,
    "bravery" INTEGER,
    "benevolence" INTEGER,
    "energy" INTEGER,
    "extroversion" INTEGER,
    "dedication" INTEGER,
    "friends" JSONB NOT NULL,
    "family" JSONB NOT NULL,
    "bio" TEXT,

    CONSTRAINT "UserCat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserCat" ADD CONSTRAINT "UserCat_trinketId_fkey" FOREIGN KEY ("trinketId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
