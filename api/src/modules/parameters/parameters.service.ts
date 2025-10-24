import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Parameter } from './entities/parameter.entity';
import { DEFAULT_PARAMETERS } from './default-parameters';

@Injectable()
export class ParametersService implements OnModuleInit {
  private readonly logger = new Logger(ParametersService.name);
  private readonly CACHE_TTL = 3600; // 1 heure en secondes

  constructor(
    @InjectRepository(Parameter)
    private readonly parameterRepository: Repository<Parameter>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Initialise les paramètres par défaut au démarrage
   */
  async onModuleInit() {
    this.logger.log('Initializing default parameters...');

    for (const defaultParam of DEFAULT_PARAMETERS) {
      const existingParam = await this.parameterRepository.findOne({
        where: { key: defaultParam.key },
      });

      if (!existingParam) {
        await this.set(
          defaultParam.key,
          defaultParam.value,
          defaultParam.description,
        );
        this.logger.log(`✓ Created parameter: ${defaultParam.key}`);
      }
    }

    this.logger.log('Default parameters initialization completed');
  }

  /**
   * Récupère la dernière version active d'un paramètre
   */
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = `parameter:${key}`;

    // Vérifier le cache
    const cachedValue = await this.cacheManager.get<T>(cacheKey);
    if (cachedValue !== undefined && cachedValue !== null) {
      return cachedValue;
    }

    // Si pas en cache, récupérer de la DB
    const parameter = await this.parameterRepository.findOne({
      where: { key, isActive: true },
      order: { version: 'DESC' },
    });

    const value = parameter ? parameter.value : null;

    // Mettre en cache
    if (value !== null) {
      await this.cacheManager.set(cacheKey, value, this.CACHE_TTL * 1000);
    }

    return value;
  }

  /**
   * Récupère une version spécifique d'un paramètre
   */
  async getVersion<T = any>(key: string, version: number): Promise<T | null> {
    const parameter = await this.parameterRepository.findOne({
      where: { key, version, isActive: true },
    });

    return parameter ? parameter.value : null;
  }

  /**
   * Crée ou met à jour un paramètre (incrémente la version)
   */
  async set(
    key: string,
    value: any,
    description?: string,
  ): Promise<Parameter> {
    // Récupère la dernière version
    const lastParameter = await this.parameterRepository.findOne({
      where: { key },
      order: { version: 'DESC' },
    });

    const newVersion = lastParameter ? lastParameter.version + 1 : 1;

    const parameter = this.parameterRepository.create({
      key,
      value,
      version: newVersion,
      description,
      isActive: true,
    });

    const savedParameter = await this.parameterRepository.save(parameter);

    // Invalider le cache
    await this.invalidateCache(key);

    return savedParameter;
  }

  /**
   * Invalide le cache pour un paramètre
   */
  private async invalidateCache(key: string): Promise<void> {
    const cacheKey = `parameter:${key}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Désactive une version spécifique
   */
  async deactivateVersion(key: string, version: number): Promise<void> {
    await this.parameterRepository.update({ key, version }, { isActive: false });
  }

  /**
   * Liste toutes les versions d'un paramètre
   */
  async getVersions(key: string): Promise<Parameter[]> {
    return this.parameterRepository.find({
      where: { key },
      order: { version: 'DESC' },
    });
  }

  /**
   * Liste tous les paramètres (dernière version active de chaque clé)
   */
  async getAll(): Promise<Parameter[]> {
    const allParameters = await this.parameterRepository.find({
      where: { isActive: true },
      order: { key: 'ASC', version: 'DESC' },
    });

    // Garder seulement la dernière version de chaque clé
    const latestByKey = new Map<string, Parameter>();
    allParameters.forEach(param => {
      if (!latestByKey.has(param.key) || latestByKey.get(param.key).version < param.version) {
        latestByKey.set(param.key, param);
      }
    });

    return Array.from(latestByKey.values());
  }

  /**
   * Restaure une version spécifique (la rend active et désactive les autres)
   */
  async restoreVersion(key: string, version: number): Promise<Parameter> {
    // Vérifier que la version existe
    const parameter = await this.parameterRepository.findOne({
      where: { key, version },
    });

    if (!parameter) {
      throw new Error(`Parameter version ${key}@${version} not found`);
    }

    // Réactiver cette version
    await this.parameterRepository.update({ key, version }, { isActive: true });

    // Désactiver toutes les autres versions
    await this.parameterRepository
      .createQueryBuilder()
      .update(Parameter)
      .set({ isActive: false })
      .where('key = :key', { key })
      .andWhere('version != :version', { version })
      .execute();

    // Invalider le cache
    await this.invalidateCache(key);

    return this.parameterRepository.findOne({ where: { key, version } });
  }

  /**
   * Supprime une version spécifique (attention: suppression définitive)
   */
  async deleteVersion(key: string, version: number): Promise<void> {
    await this.parameterRepository.delete({ key, version });
    await this.invalidateCache(key);
  }
}
