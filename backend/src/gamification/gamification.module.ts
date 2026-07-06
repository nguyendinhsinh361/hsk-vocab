import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';

/** XP / level / streak / mastery — dùng chung cho mọi feature. */
@Module({
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
