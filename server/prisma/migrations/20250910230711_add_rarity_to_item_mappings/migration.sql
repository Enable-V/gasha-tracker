/*
  Warnings:

  - Added the required column `rarity` to the `item_name_mappings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `item_name_mappings` ADD COLUMN `rarity` INTEGER NOT NULL DEFAULT 5;
