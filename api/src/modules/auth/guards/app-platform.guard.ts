import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppValidationService } from '../services/app-validation.service';

/**
 * Guard pour valider que les requêtes HTTP proviennent uniquement des applications mobiles
 * Vérifie :
 * 1. L'API Key secrète dans les headers
 * 2. Le Bundle ID (iOS) ou Package Name (Android) dans le JWT
 *
 * Note: Les versions de l'app et de l'OS sont loggées mais n'invalident pas le JWT
 */
@Injectable()
export class AppPlatformGuard implements CanActivate {
  constructor(
    private appValidationService: AppValidationService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Vérifier si la route est publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Valider la requête
    this.appValidationService.validateRequest({
      headers: request.headers,
      bundleId: user?.bundleId,
      platform: user?.platform,
    });

    return true;
  }
}
