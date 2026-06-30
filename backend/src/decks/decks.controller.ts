import { Controller, Get, Param, Query } from '@nestjs/common';
import { DecksService } from './decks.service';
import { HskLevel } from '@prisma/client';

@Controller('decks')
export class DecksController {
  constructor(private decks: DecksService) {}

  @Get()
  findAll(@Query('level') level?: HskLevel) {
    return this.decks.findAll(level);
  }

  @Get(':id/cards')
  findCards(@Param('id') id: string) {
    return this.decks.findCards(id);
  }

  @Get(':id/tree')
  wordTree(@Param('id') id: string) {
    return this.decks.wordTree(id);
  }
}
