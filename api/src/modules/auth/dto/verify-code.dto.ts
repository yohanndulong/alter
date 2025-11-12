import { IsEmail, IsString, Length, IsIn } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  bundleId: string;

  @IsString()
  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
