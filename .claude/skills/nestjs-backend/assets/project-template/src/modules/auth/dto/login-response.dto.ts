import { UserResponseDto } from '../../users/dto/user-response.dto';
import { TokenPairDto } from './token-pair.dto';

export class LoginResponseDto extends TokenPairDto {
  user!: UserResponseDto;
}
