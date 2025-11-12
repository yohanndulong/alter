import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppValidationContext {
  headers: Record<string, string | string[]>;
  bundleId?: string;
  platform?: string;
}

/**
 * Service de validation pour s'assurer que les requêtes (HTTP et WebSocket)
 * proviennent uniquement des applications mobiles officielles
 */
@Injectable()
export class AppValidationService {
  private readonly logger = new Logger(AppValidationService.name);
  private readonly allowedBundleIds: string[];
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    // Bundle IDs autorisés (stables, ne changent jamais)
    this.allowedBundleIds = [
      'com.alterdating.alter', // iOS & Android
    ];

    // API Key secrète pour filtrer les appels non-mobiles
    this.apiKey = this.configService.get<string>('MOBILE_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('⚠️  MOBILE_API_KEY non définie dans .env - La validation sera désactivée');
    }
  }

  /**
   * Valide une requête (HTTP ou WebSocket)
   * @param context - Contexte contenant headers et infos JWT
   * @throws UnauthorizedException si la validation échoue
   */
  validateRequest(context: AppValidationContext): void {
    const { headers, bundleId, platform } = context;

    // Si pas de MOBILE_API_KEY configurée, on skip la validation (mode dev)
    if (!this.apiKey) {
      this.logger.debug('Validation désactivée (pas de MOBILE_API_KEY)');
      return;
    }

    // 1. Vérifier l'API Key dans les headers
    const appKey = this.getHeader(headers, 'x-app-key');
    if (!appKey || appKey !== this.apiKey) {
      this.logger.warn('Tentative d\'accès sans API key valide');
      throw new UnauthorizedException('API key invalide ou manquante');
    }

    // 2. Vérifier le Bundle ID dans le JWT
    if (!bundleId) {
      this.logger.warn('JWT sans bundleId détecté');
      throw new UnauthorizedException('Bundle ID manquant dans le token');
    }

    if (!this.allowedBundleIds.includes(bundleId)) {
      this.logger.warn(`Bundle ID non autorisé: ${bundleId}`);
      throw new UnauthorizedException('Bundle ID non autorisé');
    }

    // 3. Logger les versions (pour analytics) sans bloquer
    const appVersion = this.getHeader(headers, 'x-app-version');
    const osVersion = this.getHeader(headers, 'x-os-version');

    this.logger.debug(
      `✅ Requête validée - Platform: ${platform || 'unknown'}, Bundle: ${bundleId}, ` +
      `App: ${appVersion || 'N/A'}, OS: ${osVersion || 'N/A'}`
    );
  }

  /**
   * Récupère un header (case-insensitive)
   */
  private getHeader(headers: Record<string, string | string[]>, key: string): string | undefined {
    const normalizedKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === normalizedKey) {
        return Array.isArray(v) ? v[0] : v;
      }
    }
    return undefined;
  }

  /**
   * Vérifie si la validation est activée
   */
  isValidationEnabled(): boolean {
    return !!this.apiKey;
  }
}
