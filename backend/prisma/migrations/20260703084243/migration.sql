-- CreateTable
CREATE TABLE `Topic` (
    `id` VARCHAR(191) NOT NULL,
    `hskLevel` ENUM('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `title` JSON NOT NULL,
    `groupType` ENUM('TOPIC_GROUP') NOT NULL DEFAULT 'TOPIC_GROUP',
    `estimatedMinutes` INTEGER NOT NULL DEFAULT 0,

    INDEX `Topic_hskLevel_order_idx`(`hskLevel`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Word` (
    `id` VARCHAR(191) NOT NULL,
    `hz` VARCHAR(191) NOT NULL,
    `py` VARCHAR(191) NOT NULL,
    `hv` VARCHAR(191) NOT NULL,
    `pos` ENUM('N', 'V', 'ADJ', 'ADV', 'PRON', 'NUM', 'MW', 'AUX', 'PREP', 'CONJ', 'INTERJ', 'PART', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `meaning` JSON NOT NULL,
    `audioUrl` VARCHAR(191) NULL,
    `mw` VARCHAR(191) NULL,
    `exSample` TEXT NULL,
    `exPinyin` TEXT NULL,
    `exMeaning` JSON NULL,
    `hskLevel` ENUM('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6') NOT NULL,
    `hanVietLevel` ENUM('M1', 'M2', 'M3') NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Word_hskLevel_idx`(`hskLevel`),
    INDEX `Word_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Root` (
    `id` VARCHAR(191) NOT NULL,
    `hz` VARCHAR(191) NOT NULL,
    `py` VARCHAR(191) NOT NULL,
    `hv` VARCHAR(191) NOT NULL,
    `hskLevel` ENUM('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6') NOT NULL,
    `topicId` VARCHAR(191) NULL,

    INDEX `Root_hskLevel_idx`(`hskLevel`),
    INDEX `Root_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RootPattern` (
    `id` VARCHAR(191) NOT NULL,
    `rootId` VARCHAR(191) NOT NULL,
    `formula` VARCHAR(191) NOT NULL,
    `meaning` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `RootPattern_rootId_idx`(`rootId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PatternWord` (
    `patternId` VARCHAR(191) NOT NULL,
    `wordId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `PatternWord_wordId_idx`(`wordId`),
    PRIMARY KEY (`patternId`, `wordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicWord` (
    `topicId` VARCHAR(191) NOT NULL,
    `wordId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `TopicWord_wordId_idx`(`wordId`),
    PRIMARY KEY (`topicId`, `wordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WordRoot` (
    `wordId` VARCHAR(191) NOT NULL,
    `rootId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `WordRoot_rootId_idx`(`rootId`),
    PRIMARY KEY (`wordId`, `rootId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exercise` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NULL,
    `rootId` VARCHAR(191) NULL,
    `wordId` VARCHAR(191) NOT NULL,
    `type` ENUM('A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3') NOT NULL,
    `group` ENUM('A', 'B', 'C', 'D') NOT NULL,
    `title` JSON NOT NULL,
    `question` JSON NOT NULL,
    `answers` JSON NOT NULL,
    `correctAnswer` JSON NOT NULL,
    `explanation` JSON NULL,
    `audioScript` TEXT NULL,
    `imageDescription` TEXT NULL,
    `hskLevel` ENUM('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `Exercise_topicId_idx`(`topicId`),
    INDEX `Exercise_wordId_idx`(`wordId`),
    INDEX `Exercise_rootId_idx`(`rootId`),
    INDEX `Exercise_type_idx`(`type`),
    INDEX `Exercise_group_idx`(`group`),
    INDEX `Exercise_hskLevel_idx`(`hskLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `xp` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `streak` INTEGER NOT NULL DEFAULT 0,
    `lastActiveDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserWordProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `wordId` VARCHAR(191) NOT NULL,
    `mastery` ENUM('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED') NOT NULL DEFAULT 'NEW',
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `seenCount` INTEGER NOT NULL DEFAULT 0,
    `lastSeenAt` DATETIME(3) NULL,

    INDEX `UserWordProgress_userId_idx`(`userId`),
    UNIQUE INDEX `UserWordProgress_userId_wordId_key`(`userId`, `wordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NULL,
    `rootId` VARCHAR(191) NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PracticeSession_userId_idx`(`userId`),
    INDEX `PracticeSession_topicId_idx`(`topicId`),
    INDEX `PracticeSession_rootId_idx`(`rootId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PracticeAnswer_sessionId_idx`(`sessionId`),
    INDEX `PracticeAnswer_exerciseId_idx`(`exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Root` ADD CONSTRAINT `Root_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RootPattern` ADD CONSTRAINT `RootPattern_rootId_fkey` FOREIGN KEY (`rootId`) REFERENCES `Root`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatternWord` ADD CONSTRAINT `PatternWord_patternId_fkey` FOREIGN KEY (`patternId`) REFERENCES `RootPattern`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatternWord` ADD CONSTRAINT `PatternWord_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicWord` ADD CONSTRAINT `TopicWord_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicWord` ADD CONSTRAINT `TopicWord_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordRoot` ADD CONSTRAINT `WordRoot_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordRoot` ADD CONSTRAINT `WordRoot_rootId_fkey` FOREIGN KEY (`rootId`) REFERENCES `Root`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exercise` ADD CONSTRAINT `Exercise_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exercise` ADD CONSTRAINT `Exercise_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exercise` ADD CONSTRAINT `Exercise_rootId_fkey` FOREIGN KEY (`rootId`) REFERENCES `Root`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWordProgress` ADD CONSTRAINT `UserWordProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWordProgress` ADD CONSTRAINT `UserWordProgress_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSession` ADD CONSTRAINT `PracticeSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAnswer` ADD CONSTRAINT `PracticeAnswer_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PracticeSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAnswer` ADD CONSTRAINT `PracticeAnswer_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
