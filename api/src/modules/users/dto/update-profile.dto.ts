import { IsString, IsNumber, IsEnum, IsArray, IsOptional, Min, Max } from 'class-validator';
import { Gender } from '../entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  locationLatitude?: number;

  @IsOptional()
  @IsNumber()
  locationLongitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsNumber()
  @Min(18)
  preferenceAgeMin?: number;

  @IsOptional()
  @IsNumber()
  @Max(100)
  preferenceAgeMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  preferenceDistance?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  preferenceGenders?: Gender[];
}
