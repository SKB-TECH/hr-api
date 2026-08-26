import { UserRole } from '../../../../utils/enums';

export interface JwtPayload {
  sub: string;
  email: string | null;
  phone?: string | null;
  role: UserRole | null;
  profiles: Array<'CANDIDATE' | 'COMPANY'>;
  activeProfile: 'CANDIDATE' | 'COMPANY';
}
