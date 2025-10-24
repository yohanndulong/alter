import { Controller, Post, Delete, Body, UseGuards, Query } from '@nestjs/common';
import { TestDataService } from './test-data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly testDataService: TestDataService) {}

  /**
   * Génère des données de test
   * POST /admin/generate-test-data
   */
  @Post('generate-test-data')
  async generateTestData(
    @CurrentUser() user: User,
    @Body() options?: {
      usersCount?: number;
      withProfiles?: boolean;
      withMatches?: boolean;
      withLikes?: boolean;
      withMessages?: boolean;
    },
  ) {
    return await this.testDataService.generateTestData(options, user.id);
  }

  /**
   * Supprime les données de test
   * DELETE /admin/test-data
   */
  @Delete('test-data')
  async clearTestData() {
    await this.testDataService.clearTestData();
    return { message: 'Données de test supprimées avec succès' };
  }

  /**
   * Supprime TOUTES les données (DANGEREUX)
   * DELETE /admin/all-data?confirm=yes
   */
  @Delete('all-data')
  async clearAllData(@Query('confirm') confirm: string) {
    if (confirm !== 'yes') {
      return {
        error: 'Confirmation requise',
        message: 'Ajoutez ?confirm=yes pour confirmer la suppression totale',
      };
    }

    await this.testDataService.clearAllData();
    return { message: 'Toutes les données ont été supprimées' };
  }
}
