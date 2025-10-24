import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

export enum PhotoViewMode {
  ONCE = 'once', // Vue une seule fois
  UNLIMITED = 'unlimited', // Vue illimitée
}

export enum MediaReceiverStatus {
  PENDING = 'pending', // En attente de décision du destinataire
  ACCEPTED = 'accepted', // Accepté par le destinataire
  REJECTED = 'rejected', // Refusé par le destinataire
}

@Entity('message_media')
export class MessageMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @OneToOne(() => Message, (message) => message.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  // Chemin du fichier stocké (pour compatibilité, optionnel maintenant)
  @Column({ nullable: true })
  filePath: string;

  // Données binaires du fichier stockées en base
  @Column({ type: 'bytea', nullable: true })
  fileData: Buffer;

  // Type MIME du fichier
  @Column()
  mimeType: string;

  // Taille du fichier en octets
  @Column({ type: 'int' })
  fileSize: number;

  // Durée pour les vocaux (en secondes)
  @Column({ type: 'int', nullable: true })
  duration: number;

  // Pour les photos : est-ce une photo "reel" (prise avec l'app)
  @Column({ default: false })
  isReel: boolean;

  // Pour les photos : mode d'affichage
  @Column({
    type: 'enum',
    enum: PhotoViewMode,
    nullable: true,
  })
  viewMode: PhotoViewMode;

  // Pour les photos : durée d'affichage si mode ONCE (en secondes)
  @Column({ type: 'int', nullable: true })
  viewDuration: number;

  // Pour les photos : a été vue par le destinataire
  @Column({ default: false })
  viewed: boolean;

  // Pour les photos : date de visualisation
  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  // Analyse de modération (contenu sensible)
  @Column({ type: 'jsonb', nullable: true })
  moderationResult: {
    isSafe: boolean;
    nudityScore?: number;
    violenceScore?: number;
    explicitScore?: number;
    warnings?: string[];
  };

  // Statut de l'image pour le destinataire (pour contenu sensible)
  @Column({
    type: 'enum',
    enum: MediaReceiverStatus,
    default: MediaReceiverStatus.PENDING,
  })
  receiverStatus: MediaReceiverStatus;

  // Date de décision du destinataire
  @Column({ type: 'timestamp', nullable: true })
  receiverDecisionAt: Date;

  // Thumbnail pour les photos (URL signée)
  @Column({ nullable: true })
  thumbnailPath: string;

  // URL signée (non persistée en base, générée dynamiquement)
  url?: string;

  @CreateDateColumn()
  createdAt: Date;
}
