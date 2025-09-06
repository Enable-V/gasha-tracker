-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(20) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NULL,
    `password` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_uid_key`(`uid`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banner_id` VARCHAR(20) NOT NULL,
    `banner_name` VARCHAR(100) NOT NULL,
    `banner_type` ENUM('character', 'weapon', 'standard', 'beginner') NOT NULL,
    `start_time` DATETIME(3) NULL,
    `end_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `banners_banner_id_key`(`banner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gacha_pulls` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `banner_id` VARCHAR(20) NOT NULL,
    `gacha_id` VARCHAR(50) NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `item_type` VARCHAR(50) NOT NULL,
    `rank_type` INTEGER NOT NULL,
    `time` DATETIME(3) NOT NULL,
    `pity_count` INTEGER NOT NULL DEFAULT 0,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gacha_pulls_gacha_id_key`(`gacha_id`),
    INDEX `gacha_pulls_user_id_banner_id_idx`(`user_id`, `banner_id`),
    INDEX `gacha_pulls_time_idx`(`time`),
    INDEX `gacha_pulls_rank_type_idx`(`rank_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `banner_type` VARCHAR(20) NOT NULL,
    `total_pulls` INTEGER NOT NULL DEFAULT 0,
    `five_star_count` INTEGER NOT NULL DEFAULT 0,
    `four_star_count` INTEGER NOT NULL DEFAULT 0,
    `three_star_count` INTEGER NOT NULL DEFAULT 0,
    `current_pity` INTEGER NOT NULL DEFAULT 0,
    `last_five_star_time` DATETIME(3) NULL,
    `last_updated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_stats_user_id_banner_type_key`(`user_id`, `banner_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gacha_pulls` ADD CONSTRAINT `gacha_pulls_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gacha_pulls` ADD CONSTRAINT `gacha_pulls_banner_id_fkey` FOREIGN KEY (`banner_id`) REFERENCES `banners`(`banner_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_stats` ADD CONSTRAINT `user_stats_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
