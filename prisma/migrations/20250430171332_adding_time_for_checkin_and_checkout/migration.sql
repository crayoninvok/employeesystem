-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('TEPAT_WAKTU', 'TERLAMBAT', 'DILUAR_JADWAL');

-- AlterTable
ALTER TABLE "Absensi" ADD COLUMN     "status" "CheckInStatus" NOT NULL DEFAULT 'TEPAT_WAKTU',
ADD COLUMN     "workDuration" DOUBLE PRECISION;
