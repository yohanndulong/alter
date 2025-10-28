import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuestionType {
  TEXT = 'text',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  DATE = 'date',
  NUMBER = 'number',
  SLIDER = 'slider',
  RANGE = 'range',
  PHOTO = 'photo',
  CITY_LOCATION = 'city_location',
}

@Entity('onboarding_questions')
export class OnboardingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column()
  question: string;

  @Column({ nullable: true })
  placeholder: string;

  @Column('simple-array', { nullable: true })
  options: string[];

  @Column({ default: true })
  required: boolean;

  @Column({ type: 'int', nullable: true })
  min: number;

  @Column({ type: 'int', nullable: true })
  max: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
