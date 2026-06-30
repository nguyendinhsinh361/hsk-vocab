import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';

import { Paginated } from '../../common/dto/paginated';
import { AuthUser } from '../../iam/auth-user';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import { Public } from '../../iam/decorators/public.decorator';
import { Roles } from '../../iam/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

/** Thin controller: HTTP in/out only; rules live in the service (SRP). */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id, user);
  }

  @Roles('admin')
  @Get()
  list(@Query() query: ListUsersQueryDto): Promise<Paginated<UserResponseDto>> {
    return this.usersService.list(query);
  }
}
