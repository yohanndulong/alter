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

@Entity('passes')
@Index(['userId', 'passedUserId'], { unique: true })
export class Pass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  passedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'passedUserId' })
  passedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
