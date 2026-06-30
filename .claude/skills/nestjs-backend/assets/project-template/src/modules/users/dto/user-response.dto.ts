/** The fields the DTO maps from — structural, so this file depends neither on
 *  the generated Prisma model nor on anything it might grow later. */
interface UserLike {
  id: number;
  email: string;
  role: string;
  createdAt: Date;
}

/** The API shape of a user — decoupled from the persistence model (DIP at the
 *  boundary). passwordHash cannot leak: it is simply not here. */
export class UserResponseDto {
  id!: number;
  email!: string;
  role!: string;
  createdAt!: string;

  static from(user: UserLike): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
