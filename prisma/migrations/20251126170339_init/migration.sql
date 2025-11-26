/*
  Warnings:

  - You are about to drop the column `image` on the `recipes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `difficulty` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainImage` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `recipe_steps` ADD COLUMN `image` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `recipes` DROP COLUMN `image`,
    ADD COLUMN `difficulty` VARCHAR(191) NOT NULL,
    ADD COLUMN `mainImage` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `googleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_googleId_key` ON `users`(`googleId`);
