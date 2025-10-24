import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { CompatibilityService } from './compatibility.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly compatibilityService: CompatibilityService,
  ) {}

  @Get('discover')
  async getDiscoverProfilesGet(@CurrentUser() user: User) {
    const profiles = await this.matchingService.getDiscoverProfiles(user.id);
    return {
      hasProfileEmbedding: !!user.profileEmbedding,
      profiles,
    };
  }

  @Post('discover')
  async getDiscoverProfiles(@CurrentUser() user: User, @Body() body?: { filters?: any }) {
    const profiles = await this.matchingService.getDiscoverProfiles(user.id, body?.filters);
    return {
      hasProfileEmbedding: !!user.profileEmbedding,
      profiles,
    };
  }

  @Post('like/:userId')
  async likeProfile(@CurrentUser() user: User, @Param('userId') userId: string) {
    return this.matchingService.likeProfile(user.id, userId);
  }

  @Post('pass/:userId')
  async passProfile(@CurrentUser() user: User, @Param('userId') userId: string) {
    await this.matchingService.passProfile(user.id, userId);
    return { message: 'Profile passed' };
  }

  @Get('matches')
  async getMatches(@CurrentUser() user: User) {
    return this.matchingService.getMatches(user.id);
  }

  @Get('interested')
  async getInterestedProfiles(@CurrentUser() user: User) {
    return this.matchingService.getInterestedProfiles(user.id);
  }

  @Delete('matches/:matchId')
  async unmatch(@CurrentUser() user: User, @Param('matchId') matchId: string) {
    const result = await this.matchingService.unmatch(user.id, matchId);
    return {
      message: result.canLikeAgain
        ? `Conversation supprimée. Vous pouvez de nouveau liker des profils (${result.remainingSlots} slots disponibles).`
        : 'Conversation supprimée.',
      ...result,
    };
  }

  @Get('conversations/status')
  async getConversationsStatus(@CurrentUser() user: User) {
    return this.matchingService.getConversationsStatus(user.id);
  }

  /**
   * Récupère les statistiques du cache de compatibilité
   */
  @Get('compatibility/stats')
  async getCompatibilityStats() {
    return this.compatibilityService.getCacheStats();
  }

  /**
   * Invalide le cache de compatibilité pour l'utilisateur actuel
   * Utile après une mise à jour de profil
   */
  @Post('compatibility/invalidate')
  async invalidateCompatibilityCache(@CurrentUser() user: User) {
    const count = await this.compatibilityService.invalidateUserCache(user.id);
    return {
      message: 'Cache invalidé avec succès',
      entriesDeleted: count,
    };
  }

  /**
   * Nettoie les caches expirés (endpoint admin/cron)
   */
  @Post('compatibility/cleanup')
  async cleanupExpiredCaches() {
    const count = await this.compatibilityService.cleanExpiredCaches();
    return {
      message: 'Nettoyage effectué',
      entriesDeleted: count,
    };
  }
}
