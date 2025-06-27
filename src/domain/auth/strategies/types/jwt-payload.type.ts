import { Session } from 'src/domain/session/entities/session.entity';
import { User, UserRole } from '../../../users/entities/user.entity';

export type JwtPayloadType = Pick<User, 'id'> & {
  sessionId: Session['id'];
  iat: number;
  exp: number;
  role: UserRole;
};
