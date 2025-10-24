import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateParameterDto {
  @IsNotEmpty()
  value: any;

  @IsOptional()
  @IsString()
  description?: string;
}
