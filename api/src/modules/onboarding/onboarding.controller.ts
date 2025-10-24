import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OnboardingQuestion } from './entities/onboarding-question.entity';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('questions')
  async getQuestions(): Promise<OnboardingQuestion[]> {
    return this.onboardingService.getQuestions();
  }

  @Post('answers')
  async submitAnswers(
    @CurrentUser() user: User,
    @Body() submitAnswersDto: SubmitAnswersDto,
  ): Promise<{ message: string }> {
    await this.onboardingService.submitAnswers(user.id, submitAnswersDto.answers);
    return { message: 'Answers submitted successfully' };
  }

  @Post('complete')
  async completeOnboarding(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.onboardingService.completeOnboarding(user.id);
    return { message: 'Onboarding completed successfully' };
  }
}
