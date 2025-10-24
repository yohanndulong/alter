import { api } from './api'
import { OnboardingQuestion, OnboardingAnswer } from '@/types'

export const onboardingService = {
  async getQuestions(): Promise<OnboardingQuestion[]> {
    return api.get<OnboardingQuestion[]>('/onboarding/questions')
  },

  async submitAnswers(answers: OnboardingAnswer[]): Promise<void> {
    return api.post('/onboarding/answers', { answers })
  },

  async completeOnboarding(): Promise<void> {
    return api.post('/onboarding/complete')
  },
}