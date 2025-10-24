import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from '../../matching/entities/match.entity';
import { MessageMedia } from './message-media.entity';

export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  PHOTO = 'photo',
  SYSTEM = 'system',
}

@Entity('messages')
@Index(['matchId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  receiverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @OneToOne(() => MessageMedia, (media) => media.message, { nullable: true, eager: true })
  media: MessageMedia;

  @Column({ default: false })
  delivered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
