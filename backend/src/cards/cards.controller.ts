import { Controller, Get, Param } from '@nestjs/common';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private cards: CardsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cards.findOne(id);
  }
}
