import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { UsersModule } from '../users/users.module';
import { ReviewModule } from '../review/review.module';

@Module({
  // ReviewModule: đếm số từ đến hạn ôn cho card "Ôn tập X từ".
  imports: [UsersModule, ReviewModule],
  providers: [HomeService],
  controllers: [HomeController],
})
export class HomeModule {}
