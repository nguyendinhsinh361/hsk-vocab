import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [PracticeService],
  controllers: [PracticeController],
  exports: [PracticeService],
})
export class PracticeModule {}
