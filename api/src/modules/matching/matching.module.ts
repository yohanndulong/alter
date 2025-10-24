import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Like } from './entities/like.entity';
import { Pass } from './entities/pass.entity';
import { CompatibilityCache } from './entities/compatibility-cache.entity';
import { User } from '../users/entities/user.entity';
import { MatchingService } from './matching.service';
import { CompatibilityService } from './compatibility.service';
import { MatchingController } from './matching.controller';
import { LlmModule } from '../llm/llm.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { UsersModule } from '../users/users.module';
import { ParametersModule } from '../parameters/parameters.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Like, Pass, CompatibilityCache, User]),
    LlmModule,
    EmbeddingsModule,
    forwardRef(() => UsersModule),
    ParametersModule,
    NotificationsModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService, CompatibilityService],
  exports: [MatchingService, CompatibilityService],
})
export class MatchingModule {}
