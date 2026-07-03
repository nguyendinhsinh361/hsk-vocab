import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentUserId } from '../common/current-user.decorator';

/** Màn Trang chủ: GET /home → greeting + nhóm gốc + gốc phổ biến. */
@Controller('home')
export class HomeController {
  constructor(private home: HomeService) {}

  @Get()
  get(@CurrentUserId() userId: string) {
    return this.home.getHome(userId);
  }
}
