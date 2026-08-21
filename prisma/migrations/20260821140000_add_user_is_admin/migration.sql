-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Data: mark Arthur as the household admin (the only account allowed to
-- create/edit/remove other users).
UPDATE "User" SET "isAdmin" = true WHERE "email" = 'arthur.rivaroli21@gmail.com';
