import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Cache des scores de compatibilité entre deux utilisateurs
 * Permet d'éviter de recalculer les compatibilités si les profils n'ont pas changé
 */
@Entity('compatibility_cache')
@Index(['userId', 'targetUserId'], { unique: true })
@Index(['userId', 'scoreGlobal'])
@Index(['userId', 'userProfileHash', 'targetProfileHash'])
export class CompatibilityCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  // Scores de compatibilité
  @Column({ type: 'int' })
  scoreGlobal: number;

  @Column({ type: 'int', nullable: true })
  scoreLove: number;

  @Column({ type: 'int', nullable: true })
  scoreFriendship: number;

  @Column({ type: 'int', nullable: true })
  scoreCarnal: number;

  // Insight généré par l'IA
  @Column({ type: 'text', nullable: true })
  compatibilityInsight: string;

  // Hash des profils pour détecter les changements
  @Column({ type: 'varchar', length: 64 })
  userProfileHash: string;

  @Column({ type: 'varchar', length: 64 })
  targetProfileHash: string;

  // Score de similarité de l'embedding (pour référence)
  @Column({ type: 'float', nullable: true })
  embeddingScore: number;

  // Gestion du cache
  @CreateDateColumn()
  calculatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
