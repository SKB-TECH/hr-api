import { IsEnum } from 'class-validator';

export enum AccountProfile {
  CANDIDATE = 'CANDIDATE',
  COMPANY = 'COMPANY',
}

export class SwitchProfileDto {
  @IsEnum(AccountProfile)
  profile: AccountProfile;
}
