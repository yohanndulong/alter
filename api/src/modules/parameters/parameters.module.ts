import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Parameter } from './entities/parameter.entity';
import { ParametersService } from './parameters.service';
import { ParametersController } from './parameters.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parameter]),
    CacheModule.register(),
  ],
  controllers: [ParametersController],
  providers: [ParametersService],
  exports: [ParametersService],
})
export class ParametersModule {}
