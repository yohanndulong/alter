import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];
}
