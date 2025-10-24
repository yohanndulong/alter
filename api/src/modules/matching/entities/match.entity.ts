import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  matchedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'matchedUserId' })
  matchedUser: User;

  @Column({ type: 'float', nullable: true })
  compatibilityScoreGlobal: number;

  @Column({ type: 'float', nullable: true })
  compatibilityScoreLove: number;

  @Column({ type: 'float', nullable: true })
  compatibilityScoreFriendship: number;

  @Column({ type: 'float', nullable: true })
  compatibilityScoreCarnal: number;

  @Column({ type: 'text', nullable: true })
  compatibilityInsight: string;

  @Column({ type: 'jsonb', nullable: true })
  compatibilityEvolution: {
    trend: 'up' | 'down' | 'stable';
    weeklyChange: number;
    lastUpdated: Date;
  };

  @Column({ type: 'float', nullable: true })
  conversationQualityScore: number;

  @Column({ nullable: true })
  lastMessageAt: Date;

  @Column({ nullable: true })
  lastMessage: string;

  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ nullable: true })
  closedAt: Date;

  @CreateDateColumn()
  matchedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
