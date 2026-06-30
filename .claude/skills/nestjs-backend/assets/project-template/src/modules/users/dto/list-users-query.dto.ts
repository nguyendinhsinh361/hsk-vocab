import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  /** Whitelisted sort fields — never interpolate client sort into SQL. */
  @IsOptional()
  @IsIn(['createdAt', 'email'])
  readonly sortBy: 'createdAt' | 'email' = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  readonly sortDir: 'ASC' | 'DESC' = 'DESC';
}
