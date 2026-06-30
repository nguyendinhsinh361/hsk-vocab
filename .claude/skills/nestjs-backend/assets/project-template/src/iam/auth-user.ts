import { Role } from './decorators/roles.decorator';

/** The authenticated principal attached to the request — keep it minimal. */
export interface AuthUser {
  id: number;
  role: Role;
}
