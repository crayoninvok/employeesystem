-- CreateEnum
CREATE TYPE "IzinType" AS ENUM ('SAKIT', 'CUTI', 'IZIN_LAINNYA');

-- CreateEnum
CREATE TYPE "IzinStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Izin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "type" "IzinType" NOT NULL,
    "alasan" TEXT NOT NULL,
    "status" "IzinStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Izin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Izin" ADD CONSTRAINT "Izin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
