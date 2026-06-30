import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUserId } from '../common/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUserId() userId: string) {
    return this.users.getProfile(userId);
  }
}
