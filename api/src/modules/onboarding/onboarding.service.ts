import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OnboardingQuestion } from './entities/onboarding-question.entity';
import { UsersService } from '../users/users.service';
import { PhotosService } from '../users/photos.service';
import { Gender, SexualOrientation, RelationshipStatus, SearchObjective } from '../users/entities/user.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingQuestion)
    private readonly questionRepository: Repository<OnboardingQuestion>,
    private readonly usersService: UsersService,
    private readonly photosService: PhotosService,
  ) {}

  async getQuestions(): Promise<OnboardingQuestion[]> {
    return this.questionRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
  }

  private mapBiologicalSexToGender(value: string): Gender {
    const mapping = {
      'Homme': Gender.MALE,
      'Femme': Gender.FEMALE,
      'Intersexe': Gender.OTHER,
      'Autre': Gender.OTHER,
    };
    return mapping[value] || Gender.MALE;
  }

  private mapSexualOrientation(value: string): SexualOrientation {
    const mapping = {
      'Hétérosexuel(le)': SexualOrientation.HETEROSEXUAL,
      'Homosexuel(le)': SexualOrientation.HOMOSEXUAL,
      'Bisexuel(le)': SexualOrientation.BISEXUAL,
      'Pansexuel(le)': SexualOrientation.PANSEXUAL,
      'Asexuel(le)': SexualOrientation.ASEXUAL,
      'Autre': SexualOrientation.OTHER,
    };
    return mapping[value] || SexualOrientation.HETEROSEXUAL;
  }

  private mapRelationshipStatus(value: string): RelationshipStatus {
    const mapping = {
      'Célibataire': RelationshipStatus.SINGLE,
      'En couple': RelationshipStatus.IN_RELATIONSHIP,
      'Marié(e)': RelationshipStatus.MARRIED,
      'Divorcé(e)': RelationshipStatus.DIVORCED,
      'Veuf/Veuve': RelationshipStatus.WIDOWED,
      'C\'est compliqué': RelationshipStatus.COMPLICATED,
    };
    return mapping[value] || RelationshipStatus.SINGLE;
  }

  private mapSearchObjectives(values: string[]): SearchObjective[] {
    const mapping = {
      'Relation sérieuse': SearchObjective.SERIOUS,
      'Amitié': SearchObjective.FRIENDSHIP,
      'Relation charnelle': SearchObjective.CASUAL,
    };
    return values.map(v => mapping[v]).filter(Boolean);
  }

  private mapGenderPreferences(values: string[]): string[] {
    const mapping = {
      'Homme': 'male',
      'Femme': 'female',
      'Autre': 'other',
    };
    return values.map(v => mapping[v] || v).filter(Boolean);
  }

  async submitAnswers(
    userId: string,
    answers: Array<{ questionId: string; questionKey?: string; answer: any }>,
  ): Promise<void> {
    // Optimization: Use questionKey from frontend if provided to avoid DB query
    const hasAllKeys = answers.every(a => a.questionKey);

    let questionMap: Record<string, string> = {};

    if (!hasAllKeys) {
      // Fallback: Get questions from DB to access their keys
      const questions = await this.questionRepository.find({
        where: {
          id: In(answers.map(a => a.questionId)),
        },
      });

      questionMap = questions.reduce((acc, q) => {
        acc[q.id] = q.key;
        return acc;
      }, {} as Record<string, string>);
    }

    const answersObj = answers.reduce((acc, item) => {
      // Prefer questionKey from frontend, fallback to DB mapping
      const key = item.questionKey || questionMap[item.questionId];
      if (key) {
        acc[key] = item.answer;
      }
      return acc;
    }, {} as Record<string, any>);

    // Map answers to user fields
    const userUpdates: any = {
      onboardingAnswers: answersObj,
    };

    if (answersObj.firstName) {
      userUpdates.firstName = answersObj.firstName;
      userUpdates.name = answersObj.firstName;
    }

    if (answersObj.birthDate) {
      userUpdates.birthDate = new Date(answersObj.birthDate);
      const age = this.calculateAge(new Date(answersObj.birthDate));
      userUpdates.age = age;
    }

    if (answersObj.city) {
      userUpdates.city = answersObj.city;
    }

    if (answersObj.biologicalSex) {
      userUpdates.gender = this.mapBiologicalSexToGender(answersObj.biologicalSex);
    }

    if (answersObj.sexualOrientation) {
      userUpdates.sexualOrientation = this.mapSexualOrientation(answersObj.sexualOrientation);
    }

    if (answersObj.relationshipStatus) {
      userUpdates.relationshipStatus = this.mapRelationshipStatus(answersObj.relationshipStatus);
    }

    if (answersObj.searchObjectives) {
      userUpdates.searchObjectives = this.mapSearchObjectives(answersObj.searchObjectives);
    }

    if (answersObj.genderPreferences) {
      // Map to preferenceGenders (existing field)
      userUpdates.preferenceGenders = this.mapGenderPreferences(
        Array.isArray(answersObj.genderPreferences)
          ? answersObj.genderPreferences
          : [answersObj.genderPreferences]
      );
    }

    if (answersObj.preferenceDistance) {
      userUpdates.preferenceDistance = parseInt(answersObj.preferenceDistance);
    }

    if (answersObj.preferenceAge) {
      // Assuming this is a range [min, max]
      if (Array.isArray(answersObj.preferenceAge)) {
        userUpdates.preferenceAgeMin = parseInt(answersObj.preferenceAge[0]);
        userUpdates.preferenceAgeMax = parseInt(answersObj.preferenceAge[1]);
      }
    }

    // Photos are already created during upload via /photos/upload endpoint
    // No need to update user.images as we removed that field

    await this.usersService.update(userId, userUpdates);
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async completeOnboarding(userId: string): Promise<void> {
    await this.usersService.update(userId, {
      onboardingComplete: true,
    });
  }
}
