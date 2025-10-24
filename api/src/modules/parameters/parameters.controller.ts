import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ParametersService } from './parameters.service';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { Parameter } from './entities/parameter.entity';

@Controller('parameters')
export class ParametersController {
  constructor(private readonly parametersService: ParametersService) {}

  /**
   * Récupère un paramètre public (accessible à tous les utilisateurs authentifiés)
   * Seuls certains paramètres sont accessibles publiquement
   */
  @Get('public/:key')
  @UseGuards(JwtAuthGuard)
  async getPublic(@Param('key') key: string): Promise<{ key: string; value: any }> {
    // Liste blanche des paramètres accessibles publiquement
    const publicParameters = [
      'upload.min_photos_per_user',
      'upload.max_photos_per_user',
      'matching.max_distance_km',
      'matching.min_compatibility_default',
      'matching.max_active_conversations',
    ];

    if (!publicParameters.includes(key)) {
      throw new ForbiddenException('This parameter is not publicly accessible');
    }

    const value = await this.parametersService.get(key);
    return { key, value };
  }

  /**
   * Liste tous les paramètres (dernière version active) - Admin only
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAll(): Promise<Parameter[]> {
    return this.parametersService.getAll();
  }

  /**
   * Récupère un paramètre spécifique - Admin only
   */
  @Get(':key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async get(@Param('key') key: string): Promise<{ key: string; value: any }> {
    const value = await this.parametersService.get(key);
    return { key, value };
  }

  /**
   * Récupère l'historique des versions d'un paramètre
   */
  @Get(':key/versions')
  async getVersions(@Param('key') key: string): Promise<Parameter[]> {
    return this.parametersService.getVersions(key);
  }

  /**
   * Met à jour un paramètre (crée une nouvelle version)
   */
  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body() updateDto: UpdateParameterDto,
  ): Promise<Parameter> {
    return this.parametersService.set(key, updateDto.value, updateDto.description);
  }

  /**
   * Restaure une version spécifique
   */
  @Put(':key/versions/:version/restore')
  async restoreVersion(
    @Param('key') key: string,
    @Param('version') version: number,
  ): Promise<Parameter> {
    return this.parametersService.restoreVersion(key, version);
  }

  /**
   * Supprime une version spécifique
   */
  @Delete(':key/versions/:version')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVersion(
    @Param('key') key: string,
    @Param('version') version: number,
  ): Promise<void> {
    return this.parametersService.deleteVersion(key, version);
  }
}
