import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Photo } from './photo.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BiologicalSex {
  MALE = 'male',
  FEMALE = 'female',
  INTERSEX = 'intersex',
}

export enum SexualOrientation {
  HETEROSEXUAL = 'heterosexual',
  HOMOSEXUAL = 'homosexual',
  BISEXUAL = 'bisexual',
  PANSEXUAL = 'pansexual',
  ASEXUAL = 'asexual',
  OTHER = 'other',
}

export enum RelationshipStatus {
  SINGLE = 'single',
  IN_RELATIONSHIP = 'in_relationship',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  COMPLICATED = 'complicated',
}

export enum SearchObjective {
  SERIOUS = 'serious',
  FRIENDSHIP = 'friendship',
  CASUAL = 'casual',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true, type: 'int' })
  age: number;

  @Column({ nullable: true })
  city: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: BiologicalSex,
    nullable: true,
  })
  biologicalSex: BiologicalSex;

  @Column({
    type: 'enum',
    enum: SexualOrientation,
    nullable: true,
  })
  sexualOrientation: SexualOrientation;

  @Column({
    type: 'enum',
    enum: RelationshipStatus,
    nullable: true,
  })
  relationshipStatus: RelationshipStatus;

  @Column('simple-array', { nullable: true })
  searchObjectives: SearchObjective[];

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  alterSummary: string;

  @Column({ type: 'int', default: 0 })
  alterProfileCompletion: number;

  @Column({ type: 'jsonb', nullable: true })
  alterProfileAI: {
    personnalité?: string | null;
    intention?: string | null;
    identité?: string | null;
    amitié?: string | null;
    amour?: string | null;
    sexualité?: string | null;
  };

  @Column('simple-array', { nullable: true })
  interests: string[];

  @Column({ type: 'float', nullable: true })
  locationLatitude: number;

  @Column({ type: 'float', nullable: true })
  locationLongitude: number;

  @Column({ default: false })
  onboardingComplete: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true })
  @Exclude()
  verificationCode: string;

  @Column({ nullable: true })
  @Exclude()
  verificationCodeExpiry: Date;

  // Preferences
  @Column({ type: 'int', default: 18 })
  preferenceAgeMin: number;

  @Column({ type: 'int', default: 50 })
  preferenceAgeMax: number;

  @Column({ type: 'int', default: 50 })
  preferenceDistance: number;

  @Column({ type: 'int', default: 50 })
  preferenceMinCompatibility: number;

  @Column('simple-array', { nullable: true })
  preferenceGenders: Gender[];

  // Compatibility scores (calculés par LLM)
  @Column({ type: 'jsonb', nullable: true })
  onboardingAnswers: Record<string, any>;

  // Profile Embedding (pour matching optimisé)
  @Column({ type: 'vector', length: 1536, nullable: true })
  profileEmbedding: number[];

  @Column({ type: 'timestamp', nullable: true })
  profileEmbeddingUpdatedAt: Date;

  // Photos
  @OneToMany(() => Photo, (photo) => photo.user)
  photos: Photo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastActiveAt: Date;
}
