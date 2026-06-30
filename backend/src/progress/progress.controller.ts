import { Controller, Get, Param } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CurrentUserId } from '../common/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('progress')
export class ProgressController {
  constructor(
    private progress: ProgressService,
    private users: UsersService,
  ) {}

  @Get('deck/:deckId')
  async byDeck(
    @CurrentUserId() userId: string,
    @Param('deckId') deckId: string,
  ) {
    const id = await this.users.resolveUserId(userId);
    return this.progress.listByDeck(id, deckId);
  }
}
