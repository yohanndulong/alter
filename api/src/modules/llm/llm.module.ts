import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { PromptTemplateService } from './prompt-template.service';
import { ParametersModule } from '../parameters/parameters.module';

@Module({
  imports: [ParametersModule],
  providers: [LlmService, PromptTemplateService],
  exports: [LlmService, PromptTemplateService],
})
export class LlmModule {}
