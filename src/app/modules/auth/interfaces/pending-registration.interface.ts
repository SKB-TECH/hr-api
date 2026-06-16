import { UserRole } from '@/utils/enums';

export interface PendingRegistration {
  fullName: string;
  email: string;
  role: UserRole;
  acceptTerms: boolean;
}
