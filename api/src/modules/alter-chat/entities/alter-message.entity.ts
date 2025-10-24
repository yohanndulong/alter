import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum SelectionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  FREETEXT = 'freetext',
}

@Entity('alter_messages')
@Index(['userId', 'createdAt'])
export class AlterMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @Column({
    type: 'enum',
    enum: SelectionType,
    nullable: true,
  })
  selectionType: SelectionType;

  @Column({ type: 'jsonb', nullable: true })
  structuredData: any;

  @Column({ type: 'jsonb', nullable: true })
  profileState: any;

  @CreateDateColumn()
  createdAt: Date;
}
