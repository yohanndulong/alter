import { IsArray, ValidateNested, IsString, IsNotEmpty, Allow } from 'class-validator';
import { Type } from 'class-transformer';

export class OnboardingAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @Allow()
  questionKey?: string;

  @Allow()
  answer: any;
}

export class SubmitAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingAnswerDto)
  answers: OnboardingAnswerDto[];
}
