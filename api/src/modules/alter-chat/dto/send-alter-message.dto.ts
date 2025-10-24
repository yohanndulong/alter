import { IsString, IsNotEmpty } from 'class-validator';

export class SendAlterMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
