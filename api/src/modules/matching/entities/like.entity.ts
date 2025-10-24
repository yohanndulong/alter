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

@Entity('likes')
@Index(['userId', 'likedUserId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  likedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'likedUserId' })
  likedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
