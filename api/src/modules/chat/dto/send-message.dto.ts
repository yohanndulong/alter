import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
