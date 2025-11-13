import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Match } from '../../matching/entities/match.entity'

@Entity('conversation_starters_cache')
@Index(['match'], { unique: true })
export class ConversationStartersCache {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match

  @Column({ type: 'uuid' })
  matchId: string

  @Column({ type: 'jsonb' })
  suggestions: Array<{
    id: string
    message: string
    source: 'ai' | 'common_interests' | 'predefined'
  }>

  @Column({ type: 'text', nullable: true })
  commonGround: string

  @CreateDateColumn()
  createdAt: Date
}
