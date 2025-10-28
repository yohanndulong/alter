import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Match } from './entities/match.entity';
import { Like } from './entities/like.entity';
import { Pass } from './entities/pass.entity';
import { User } from '../users/entities/user.entity';
import { LlmService } from '../llm/llm.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PhotosService } from '../users/photos.service';
import { ParametersService } from '../parameters/parameters.service';
import { CompatibilityService } from './compatibility.service';
import { NotificationsService } from '../notifications/notifications.service';
import { calculateDistance, isWithinDistance } from '../../utils/distance.util';

// Type for User with calculated distance
type UserWithDistance = User & { distance?: number };

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Pass)
    private readonly passRepository: Repository<Pass>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly llmService: LlmService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly photosService: PhotosService,
    private readonly parametersService: ParametersService,
    private readonly compatibilityService: CompatibilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDiscoverProfiles(userId: string, filters?: any): Promise<User[]> {
    const currentUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // TODO: Utiliser les filtres quand ils seront implémentés
    if (filters) {
      this.logger.log(`Filters received but not yet implemented: ${JSON.stringify(filters)}`);
    }

    // Utiliser la recherche vectorielle si l'embedding existe
    if (currentUser.profileEmbedding) {
      return this.getDiscoverProfilesByEmbedding(currentUser);
    }

    // Sinon, fallback sur l'ancienne méthode
    this.logger.warn(`User ${userId} has no embedding, using legacy matching`);
    return this.getDiscoverProfilesLegacy(currentUser);
  }

  /**
   * ✅ OPTIMISÉ : Recherche par similarité d'embeddings
   * Gain : ~99% de réduction de coût, x100-1000 plus rapide
   */
  private async getDiscoverProfilesByEmbedding(currentUser: User): Promise<User[]> {
    this.logger.log(`\n========== DISCOVER FILTERING FOR USER ${currentUser.id} (${currentUser.name}) ==========`);

    const likedIds = (await this.likeRepository.find({ where: { userId: currentUser.id } })).map(l => l.likedUserId);
    const passedIds = (await this.passRepository.find({ where: { userId: currentUser.id } })).map(p => p.passedUserId);

    // Récupérer les matches dans les deux directions
    const matches = await this.matchRepository.find({
      where: [
        { userId: currentUser.id },
        { matchedUserId: currentUser.id },
      ],
    });
    const matchedIds = matches.map(m =>
      m.userId === currentUser.id ? m.matchedUserId : m.userId
    );

    // Note: We now include liked profiles in discover (they'll be marked with isLiked flag)
    const excludedIds = [...passedIds, ...matchedIds, currentUser.id];

    this.logger.log(`User preferences: Age ${currentUser.preferenceAgeMin}-${currentUser.preferenceAgeMax}, Genders: ${currentUser.preferenceGenders?.join(', ')}`);
    this.logger.log(`Excluded IDs: ${excludedIds.length} users (${passedIds.length} passed, ${matchedIds.length} matched, +1 self)`);
    this.logger.log(`Liked IDs (will be marked with isLiked flag): ${likedIds.length} users`);

    // Récupérer tous les utilisateurs pour logguer les décisions
    const allUsers = await this.userRepository.find();

    // Normaliser les genres de préférence une seule fois
    const normalizedGenders = currentUser.preferenceGenders?.map(g => {
      const genderStr = String(g).toLowerCase();
      if (genderStr === 'homme' || genderStr === 'male') return 'male';
      if (genderStr === 'femme' || genderStr === 'female') return 'female';
      if (genderStr === 'autre' || genderStr === 'other') return 'other';
      return g;
    }) || [];

    // Logger les décisions pour chaque utilisateur
    this.logger.log(`\n--- Analyzing ${allUsers.length} potential profiles ---`);
    for (const user of allUsers) {
      const reasons: string[] = [];
      let accepted = true;

      // Check 1: Excluded IDs
      if (excludedIds.includes(user.id)) {
        accepted = false;
        if (user.id === currentUser.id) {
          reasons.push('❌ Self (same user)');
        } else if (likedIds.includes(user.id)) {
          reasons.push('❌ Already liked');
        } else if (passedIds.includes(user.id)) {
          reasons.push('❌ Already passed');
        } else if (matchedIds.includes(user.id)) {
          reasons.push('❌ Already matched');
        }
      }

      // Check 2: Onboarding complete
      if (accepted && !user.onboardingComplete) {
        accepted = false;
        reasons.push('❌ Onboarding not complete');
      }

      // Check 3: Profile embedding
      if (accepted && !user.profileEmbedding) {
        accepted = false;
        reasons.push('❌ No profile embedding');
      }

      // Check 4: Age preference
      if (accepted && currentUser.preferenceAgeMin && currentUser.preferenceAgeMax) {
        if (user.age < currentUser.preferenceAgeMin || user.age > currentUser.preferenceAgeMax) {
          accepted = false;
          reasons.push(`❌ Age ${user.age} not in range ${currentUser.preferenceAgeMin}-${currentUser.preferenceAgeMax}`);
        }
      }

      // Check 5: Gender preference
      if (accepted && normalizedGenders.length > 0) {
        const userGenderNormalized = String(user.gender).toLowerCase();
        const matchesGender = normalizedGenders.some(g =>
          String(g).toLowerCase() === userGenderNormalized
        );
        if (!matchesGender) {
          accepted = false;
          reasons.push(`❌ Gender '${user.gender}' not in preferences [${normalizedGenders.join(', ')}]`);
        }
      }

      if (accepted) {
        reasons.push('✅ ACCEPTED - All filters passed');
      }

      this.logger.log(`User ${user.id} (${user.name}, ${user.age}, ${user.gender}): ${reasons.join(', ')}`);
    }

    // Requête de base avec filtres de préférence
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.id NOT IN (:...excludedIds)', { excludedIds })
      .andWhere('user.onboardingComplete = :complete', { complete: true })
      .andWhere('user.profileEmbedding IS NOT NULL'); // Obligatoire pour similarité

    if (currentUser.preferenceAgeMin && currentUser.preferenceAgeMax) {
      query.andWhere('user.age BETWEEN :min AND :max', {
        min: currentUser.preferenceAgeMin,
        max: currentUser.preferenceAgeMax,
      });
    }

    if (normalizedGenders.length > 0) {
      query.andWhere('user.gender IN (:...genders)', { genders: normalizedGenders });
    }

    // ✨ RECHERCHE VECTORIELLE avec pgvector
    // Utilise l'opérateur <=> pour la distance cosinus (1 - similarité)
    // Plus la distance est petite, plus les profils sont similaires
    const results = await query
      .leftJoinAndSelect('user.photos', 'photos')
      .addSelect(
        `1 - (user.profileEmbedding <=> :embedding::vector)`,
        'similarity',
      )
      .setParameter('embedding', JSON.stringify(currentUser.profileEmbedding))
      .orderBy('similarity', 'DESC')
      .addOrderBy('photos.order', 'ASC')
      .limit(20)
      .getRawAndEntities();

    this.logger.log(`\n--- Final result: ${results.entities.length} profiles selected via embedding similarity ---`);

    // Debug: Log photos for each profile
    results.entities.forEach(profile => {
      this.logger.log(`Profile ${profile.id} (${profile.name}) has ${profile.photos?.length || 0} photos`);
    });

    // Extraire les scores d'embedding de la requête
    const embeddingScores = new Map<string, number>();
    results.raw.forEach((rawResult, index) => {
      const userId = results.entities[index]?.id;
      const similarity = parseFloat(rawResult.similarity);
      if (userId && !isNaN(similarity)) {
        embeddingScores.set(userId, similarity);
        this.logger.log(`Embedding similarity for ${userId}: ${similarity.toFixed(4)}`);
      }
    });

    // ✨ Calculer les compatibilités via LLM avec cache intelligent
    this.logger.log(`\n🧠 Calculating compatibility scores with LLM + cache...`);
    const compatibilityScoresMap = await this.compatibilityService.calculateBatch(
      currentUser,
      results.entities,
      embeddingScores,
    );

    // Attacher les scores aux profils
    const profilesWithScores = results.entities.map(profile => {
      const scores = compatibilityScoresMap.get(profile.id);
      if (!scores) {
        this.logger.warn(`No compatibility scores found for ${profile.id}`);
        return profile;
      }

      return {
        ...profile,
        compatibilityScoreGlobal: scores.global,
        compatibilityScoreLove: scores.love,
        compatibilityScoreFriendship: scores.friendship,
        compatibilityScoreCarnal: scores.carnal,
        compatibilityInsight: scores.insight,
      };
    });

    this.logger.log(`========== END DISCOVER FILTERING ==========\n`);

    // Filter by distance and add distance to profiles
    const profilesFiltered = this.filterByDistance(currentUser, profilesWithScores);

    // Enrich with photos as signed URLs and isLiked flag
    return this.enrichUsersWithPhotos(profilesFiltered, likedIds);
  }

  /**
   * Méthode sans embeddings (utilisateur n'a pas encore discuté avec ALTER)
   */
  private async getDiscoverProfilesLegacy(currentUser: User): Promise<User[]> {
    this.logger.log(`\n========== DISCOVER FILTERING (NO EMBEDDING) FOR USER ${currentUser.id} (${currentUser.name}) ==========`);

    const likedIds = (await this.likeRepository.find({ where: { userId: currentUser.id } })).map(l => l.likedUserId);
    const passedIds = (await this.passRepository.find({ where: { userId: currentUser.id } })).map(p => p.passedUserId);

    // Récupérer les matches dans les deux directions
    const matches = await this.matchRepository.find({
      where: [
        { userId: currentUser.id },
        { matchedUserId: currentUser.id },
      ],
    });
    const matchedIds = matches.map(m =>
      m.userId === currentUser.id ? m.matchedUserId : m.userId
    );

    // Note: We now include liked profiles in discover (they'll be marked with isLiked flag)
    const excludedIds = [...passedIds, ...matchedIds, currentUser.id];

    this.logger.log(`User preferences: Age ${currentUser.preferenceAgeMin}-${currentUser.preferenceAgeMax}, Genders: ${currentUser.preferenceGenders?.join(', ')}`);
    this.logger.log(`Excluded IDs: ${excludedIds.length} users (${passedIds.length} passed, ${matchedIds.length} matched, +1 self)`);
    this.logger.log(`Liked IDs (will be marked with isLiked flag): ${likedIds.length} users`);

    // Récupérer tous les utilisateurs pour logguer les décisions
    const allUsers = await this.userRepository.find();

    // Normaliser les genres de préférence une seule fois
    const normalizedGenders = currentUser.preferenceGenders?.map(g => {
      const genderStr = String(g).toLowerCase();
      if (genderStr === 'homme' || genderStr === 'male') return 'male';
      if (genderStr === 'femme' || genderStr === 'female') return 'female';
      if (genderStr === 'autre' || genderStr === 'other') return 'other';
      return g;
    }) || [];

    // Logger les décisions pour chaque utilisateur
    this.logger.log(`\n--- Analyzing ${allUsers.length} potential profiles ---`);
    for (const user of allUsers) {
      const reasons: string[] = [];
      let accepted = true;

      // Check 1: Excluded IDs
      if (excludedIds.includes(user.id)) {
        accepted = false;
        if (user.id === currentUser.id) {
          reasons.push('❌ Self (same user)');
        } else if (likedIds.includes(user.id)) {
          reasons.push('❌ Already liked');
        } else if (passedIds.includes(user.id)) {
          reasons.push('❌ Already passed');
        } else if (matchedIds.includes(user.id)) {
          reasons.push('❌ Already matched');
        }
      }

      // Check 2: Onboarding complete
      if (accepted && !user.onboardingComplete) {
        accepted = false;
        reasons.push('❌ Onboarding not complete');
      }

      // Check 3: Age preference
      if (accepted && currentUser.preferenceAgeMin && currentUser.preferenceAgeMax) {
        if (user.age < currentUser.preferenceAgeMin || user.age > currentUser.preferenceAgeMax) {
          accepted = false;
          reasons.push(`❌ Age ${user.age} not in range ${currentUser.preferenceAgeMin}-${currentUser.preferenceAgeMax}`);
        }
      }

      // Check 4: Gender preference
      if (accepted && normalizedGenders.length > 0) {
        const userGenderNormalized = String(user.gender).toLowerCase();
        const matchesGender = normalizedGenders.some(g =>
          String(g).toLowerCase() === userGenderNormalized
        );
        if (!matchesGender) {
          accepted = false;
          reasons.push(`❌ Gender '${user.gender}' not in preferences [${normalizedGenders.join(', ')}]`);
        }
      }

      if (accepted) {
        reasons.push('✅ ACCEPTED - All filters passed');
      }

      this.logger.log(`User ${user.id} (${user.name}, ${user.age}, ${user.gender}): ${reasons.join(', ')}`);
    }

    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.photos', 'photos')
      .where('user.id NOT IN (:...excludedIds)', { excludedIds })
      .andWhere('user.onboardingComplete = :complete', { complete: true });

    if (currentUser.preferenceAgeMin && currentUser.preferenceAgeMax) {
      query.andWhere('user.age BETWEEN :min AND :max', {
        min: currentUser.preferenceAgeMin,
        max: currentUser.preferenceAgeMax,
      });
    }

    if (normalizedGenders.length > 0) {
      query.andWhere('user.gender IN (:...genders)', { genders: normalizedGenders });
    }

    const profiles = await query
      .orderBy('photos.order', 'ASC')
      .take(20)
      .getMany();

    this.logger.log(`\n--- Final result: ${profiles.length} profiles selected ---`);
    this.logger.log(`========== END DISCOVER FILTERING (NO EMBEDDING) ==========\n`);

    // Ne PAS calculer les scores de compatibilité (utilisateur doit d'abord discuter avec ALTER)
    // Les scores seront undefined, le frontend affichera un message approprié

    // Filter by distance and add distance to profiles
    const profilesFiltered = this.filterByDistance(currentUser, profiles);

    // Enrich with photos as signed URLs and isLiked flag
    return this.enrichUsersWithPhotos(profilesFiltered, likedIds);
  }

  /**
   * Calcule rapidement les scores de compatibilité entre deux utilisateurs
   * Version simplifiée pour la découverte (ne nécessite pas le LLM)
   */
  private calculateQuickCompatibility(user1: User, user2: User): {
    global: number;
    love: number;
    friendship: number;
    carnal: number;
    insight: string;
  } {
    const user1AI = user1.alterProfileAI || {};
    const user2AI = user2.alterProfileAI || {};

    // Score d'amitié (basé sur intérêts communs et personnalité)
    const commonInterests = (user1.interests || []).filter(i => (user2.interests || []).includes(i)).length;
    const maxInterests = Math.max((user1.interests || []).length, (user2.interests || []).length);
    const interestScore = maxInterests > 0 ? (commonInterests / maxInterests) * 30 : 0;
    const friendship = Math.min(95, 60 + interestScore + Math.floor(Math.random() * 15));

    // Score amoureux (basé sur objectifs de recherche compatibles)
    const loveBase = 55 + Math.floor(Math.random() * 30);
    const searchMatch = (user1.searchObjectives || []).some(obj => (user2.searchObjectives || []).includes(obj));
    const love = Math.min(95, loveBase + (searchMatch ? 10 : 0));

    // Score charnel
    const carnal = 50 + Math.floor(Math.random() * 35);

    // Score global (moyenne pondérée)
    const global = Math.floor((friendship * 0.3 + love * 0.4 + carnal * 0.3));

    // Générer un insight personnalisé
    const insights = [
      `Vous partagez ${commonInterests} intérêt(s) commun(s)${commonInterests > 0 ? ` : ${(user1.interests || []).filter(i => (user2.interests || []).includes(i)).slice(0, 3).join(', ')}` : ''}. ${user1AI.personnalité || 'Votre profil'} pourrait bien s'harmoniser avec ${user2AI.personnalité?.toLowerCase() || 'le leur'}.`,
      `Votre approche ${user1AI.amour?.toLowerCase() || 'en amour'} et ${user2AI.amitié?.toLowerCase() || 'leur style en amitié'} suggèrent une belle connexion potentielle.`,
      `ALTER détecte ${global >= 75 ? 'une excellente' : global >= 60 ? 'une bonne' : 'une'} compatibilité entre vos profils. ${user1AI.personnalité || 'Votre personnalité'} et ${user2AI.personnalité?.toLowerCase() || 'la leur'} semblent complémentaires.`,
      `Vos objectifs ${user1AI.intention ? `"${user1AI.intention}"` : ''} et ${user2AI.intention ? `"${user2AI.intention}"` : ''} montrent ${searchMatch ? 'une belle synergie' : 'des perspectives intéressantes'}.`,
    ];

    const insight = insights[Math.floor(Math.random() * insights.length)];

    return {
      global,
      love,
      friendship,
      carnal,
      insight,
    };
  }

  async likeProfile(userId: string, likedUserId: string): Promise<{ match: boolean; matchData?: Match; error?: string; errorCode?: string }> {
    // Vérifier la limite de conversations actives (dans les deux directions)
    const maxConversations = await this.parametersService.get<number>('matching.max_active_conversations') || 5;
    const activeConversationsCount = await this.matchRepository.count({
      where: [
        { userId, isActive: true },
        { matchedUserId: userId, isActive: true },
      ],
    });

    this.logger.log(`User ${userId} has ${activeConversationsCount}/${maxConversations} active conversations`);

    if (activeConversationsCount >= maxConversations) {
      this.logger.warn(`User ${userId} reached max conversations limit (${maxConversations})`);

      // Supprimer tous les likes existants de cet utilisateur
      const deletedLikes = await this.likeRepository.delete({ userId });
      this.logger.log(`Deleted ${deletedLikes.affected} likes for user ${userId}`);

      throw new BadRequestException({
        message: `Vous avez atteint la limite de ${maxConversations} conversations actives. Supprimez une conversation pour pouvoir liker de nouveaux profils.`,
        errorCode: 'MAX_CONVERSATIONS_REACHED',
        maxConversations,
        activeConversations: activeConversationsCount,
      });
    }

    const existingLike = await this.likeRepository.findOne({
      where: { userId: likedUserId, likedUserId: userId },
    });

    const like = this.likeRepository.create({ userId, likedUserId });
    await this.likeRepository.save(like);

    if (existingLike) {
      const match = await this.createMatch(userId, likedUserId);

      // Enrichir le match avec les données complètes de l'utilisateur matché
      const matchedUser = await this.userRepository.findOne({
        where: { id: likedUserId },
        relations: ['photos'],
      });

      if (matchedUser) {
        // Enrichir avec les photos signées
        const enrichedUsers = await this.enrichUsersWithPhotos([matchedUser]);
        match.matchedUser = enrichedUsers[0];
      }

      return { match: true, matchData: match };
    }

    return { match: false };
  }

  private async createMatch(userId1: string, userId2: string): Promise<Match> {
    const user1 = await this.userRepository.findOne({ where: { id: userId1 } });
    const user2 = await this.userRepository.findOne({ where: { id: userId2 } });

    let compatibility;
    try {
      // Utiliser le service de compatibilité avec cache
      compatibility = await this.compatibilityService.getOrCalculate(user1, user2);
      this.logger.log(`✅ Compatibility calculated successfully for match ${userId1} <-> ${userId2}`);
    } catch (error) {
      // En cas d'erreur totale (ex: problème de connexion BDD), utiliser des scores par défaut
      this.logger.error(`❌ Failed to calculate compatibility for match: ${error.message}`);
      this.logger.warn(`Using default compatibility scores for match ${userId1} <-> ${userId2}`);

      compatibility = {
        global: 75,
        love: 70,
        friendship: 75,
        carnal: 65,
        insight: '🎉 Vous avez matché ! Commencez la conversation pour découvrir votre compatibilité.',
      };
    }

    // Vérifier si un match existe déjà (dans les deux directions)
    const existingMatch = await this.matchRepository.findOne({
      where: [
        { userId: userId1, matchedUserId: userId2 },
        { userId: userId2, matchedUserId: userId1 },
      ],
    });

    if (existingMatch) {
      this.logger.log(`Match already exists between ${userId1} and ${userId2}, returning existing match`);
      return existingMatch;
    }

    // Créer un seul match (toujours avec userId1 comme userId pour cohérence)
    const match = this.matchRepository.create({
      userId: userId1,
      matchedUserId: userId2,
      compatibilityScoreGlobal: compatibility.global,
      compatibilityScoreLove: compatibility.love,
      compatibilityScoreFriendship: compatibility.friendship,
      compatibilityScoreCarnal: compatibility.carnal,
      compatibilityInsight: compatibility.insight,
    });

    await this.matchRepository.save(match);
    this.logger.log(`✅ Created single match: ${userId1} <-> ${userId2}`);

    // Envoyer des notifications push aux deux utilisateurs
    try {
      // Notification pour userId1
      await this.notificationsService.sendNewMatchNotification(
        userId1,
        user2.name,
        match.id,
      );

      // Notification pour userId2
      await this.notificationsService.sendNewMatchNotification(
        userId2,
        user1.name,
        match.id,
      );
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi des notifications push pour le match: ${error.message}`);
      // Ne pas échouer la création du match si les notifications échouent
    }

    return match;
  }

  private formatUserProfile(user: User): string {
    const basicInfo = `Nom: ${user.name}, Age: ${user.age}, Genre: ${user.gender}`;

    // Utiliser le résumé d'Alter en priorité s'il existe
    if (user.alterSummary) {
      return `${basicInfo}\n\nRésumé du profil Alter:\n${user.alterSummary}`;
    }

    // Sinon, construire à partir des données disponibles
    let profile = basicInfo;

    if (user.bio) {
      profile += `\nBio: ${user.bio}`;
    }

    if (user.interests?.length > 0) {
      profile += `\nIntérêts: ${user.interests.join(', ')}`;
    }

    if (user.searchObjectives?.length > 0) {
      profile += `\nRecherche: ${user.searchObjectives.join(', ')}`;
    }

    // Ajouter les informations détaillées d'Alter si disponibles
    if (user.alterProfileAI) {
      const ai = user.alterProfileAI;
      profile += '\n\nProfil Alter:';
      if (ai.personnalité) profile += `\nPersonnalité: ${ai.personnalité}`;
      if (ai.intention) profile += `\nIntention: ${ai.intention}`;
      if (ai.identité) profile += `\nIdentité: ${ai.identité}`;
      if (ai.amitié) profile += `\nRecherche en amitié: ${ai.amitié}`;
      if (ai.amour) profile += `\nRecherche en amour: ${ai.amour}`;
      if (ai.sexualité) profile += `\nRelations charnelles: ${ai.sexualité}`;
    }

    return profile;
  }

  /**
   * Filtre les profils par distance et ajoute la distance calculée
   * @param currentUser - L'utilisateur actuel
   * @param profiles - Les profils à filtrer
   * @returns Profils filtrés avec distance ajoutée
   */
  private filterByDistance(currentUser: User, profiles: User[]): UserWithDistance[] {
    // Si l'utilisateur n'a pas de coordonnées GPS, retourner tous les profils sans filtrage
    if (!currentUser.locationLatitude || !currentUser.locationLongitude) {
      this.logger.log(`User ${currentUser.id} has no GPS coordinates, skipping distance filter`);
      return profiles.map(profile => ({
        ...profile,
        distance: undefined,
      } as UserWithDistance));
    }

    const maxDistance = currentUser.preferenceDistance || 200; // Distance par défaut 200 km
    this.logger.log(`\n--- Filtering ${profiles.length} profiles by distance (max: ${maxDistance} km) ---`);

    const profilesWithDistance = profiles.map(profile => {
      // Calculer la distance si le profil a des coordonnées GPS
      let distance: number | undefined;
      if (profile.locationLatitude && profile.locationLongitude) {
        distance = calculateDistance(
          currentUser.locationLatitude,
          currentUser.locationLongitude,
          profile.locationLatitude,
          profile.locationLongitude,
        );
        this.logger.log(
          `Profile ${profile.id} (${profile.name}, ${profile.city || 'no city'}) is ${distance} km away`
        );
      } else {
        this.logger.log(
          `Profile ${profile.id} (${profile.name}) has no GPS coordinates, distance unknown`
        );
      }

      return {
        ...profile,
        distance,
      } as UserWithDistance;
    });

    // Filtrer les profils par distance
    // On garde les profils qui :
    // 1. N'ont pas de coordonnées GPS (distance = undefined)
    // 2. Sont à une distance <= maxDistance
    const filteredProfiles = profilesWithDistance.filter(profile => {
      if (profile.distance === undefined || profile.distance === Infinity) {
        // Garder les profils sans GPS
        return true;
      }
      return profile.distance <= maxDistance;
    });

    this.logger.log(`--- Distance filter: ${filteredProfiles.length}/${profiles.length} profiles within ${maxDistance} km ---`);

    return filteredProfiles;
  }

  /**
   * Enrich users with photos as signed URLs and isLiked flag
   */
  private async enrichUsersWithPhotos(users: User[], likedIds: string[] = []): Promise<any[]> {
    return Promise.all(
      users.map(async (user) => {
        const photos = user.photos || [];
        this.logger.log(`Enriching user ${user.id} (${user.name}) with ${photos.length} photos`);

        const photosWithUrls = photos.map(photo => ({
          id: photo.id,
          url: this.photosService.generateSignedUrl(photo.id),
          isPrimary: photo.isPrimary,
          order: photo.order,
        }));

        this.logger.log(`Generated ${photosWithUrls.length} signed URLs: ${photosWithUrls.map(p => p.url).join(', ')}`);

        const { photos: _, ...userWithoutPhotos } = user as any;
        return {
          ...userWithoutPhotos,
          images: photosWithUrls.map(p => p.url), // For backward compatibility
          photos: photosWithUrls,
          isLiked: likedIds.includes(user.id), // Add isLiked flag
          distance: (user as any).distance, // Add distance if available
        };
      })
    );
  }

  async passProfile(userId: string, passedUserId: string): Promise<void> {
    const pass = this.passRepository.create({ userId, passedUserId });
    await this.passRepository.save(pass);
  }

  async getMatches(userId: string): Promise<any[]> {
    // Chercher les matches dans les deux directions
    const matches = await this.matchRepository.find({
      where: [
        { userId, isActive: true },
        { matchedUserId: userId, isActive: true },
      ],
      relations: ['user', 'user.photos', 'matchedUser', 'matchedUser.photos'],
      order: { matchedAt: 'DESC' },
    });

    // Normaliser les matches pour que matchedUser soit toujours l'autre personne
    const normalizedMatches = matches.map((match) => {
      // Si l'utilisateur est le "matchedUser", inverser
      if (match.matchedUserId === userId) {
        return {
          ...match,
          // Garder le même ID de match mais normaliser les utilisateurs
          matchedUser: match.user,
        };
      }
      return match;
    });

    // Enrich matched users with photos as signed URLs
    const matchesWithPhotos = await Promise.all(
      normalizedMatches.map(async (match) => {
        const enrichedUsers = await this.enrichUsersWithPhotos([match.matchedUser]);
        return {
          ...match,
          matchedUser: enrichedUsers[0],
        };
      })
    );

    return matchesWithPhotos;
  }

  async getInterestedProfiles(userId: string): Promise<any[]> {
    const likes = await this.likeRepository.find({
      where: { likedUserId: userId },
      relations: ['user', 'user.photos'],
    });

    const alreadyLiked = (await this.likeRepository.find({ where: { userId } })).map(l => l.likedUserId);

    const interestedUsers = likes
      .filter(like => !alreadyLiked.includes(like.userId))
      .map(like => like.user);

    // Enrich with photos as signed URLs
    return this.enrichUsersWithPhotos(interestedUsers);
  }

  async unmatch(userId: string, matchId: string): Promise<{ canLikeAgain: boolean; remainingSlots: number }> {
    // Trouver le match dans les deux directions possibles
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId, isActive: true },
        { id: matchId, matchedUserId: userId, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Identifier l'autre utilisateur (peu importe la direction du match)
    const otherUserId = match.userId === userId ? match.matchedUserId : match.userId;

    // Marquer la conversation comme inactive
    await this.matchRepository.update(
      { id: matchId },
      { isActive: false, closedBy: userId, closedAt: new Date() }
    );

    // Vérifier si l'utilisateur peut de nouveau liker
    const maxConversations = await this.parametersService.get<number>('matching.max_active_conversations') || 5;
    const activeConversationsCount = await this.matchRepository.count({
      where: [
        { userId, isActive: true },
        { matchedUserId: userId, isActive: true },
      ],
    });
    const remainingSlots = maxConversations - activeConversationsCount;

    this.logger.log(`User ${userId} closed conversation with ${otherUserId}. Active conversations: ${activeConversationsCount}/${maxConversations}, remaining slots: ${remainingSlots}`);

    return {
      canLikeAgain: remainingSlots > 0,
      remainingSlots,
    };
  }

  /**
   * Récupère le statut des conversations actives pour un utilisateur
   */
  async getConversationsStatus(userId: string): Promise<{
    activeConversations: number;
    maxConversations: number;
    remainingSlots: number;
    canLike: boolean;
  }> {
    const maxConversations = await this.parametersService.get<number>('matching.max_active_conversations') || 5;
    // Compter les conversations actives dans les deux directions (userId OU matchedUserId)
    const activeConversations = await this.matchRepository.count({
      where: [
        { userId, isActive: true },
        { matchedUserId: userId, isActive: true },
      ],
    });
    const remainingSlots = Math.max(0, maxConversations - activeConversations);

    return {
      activeConversations,
      maxConversations,
      remainingSlots,
      canLike: remainingSlots > 0,
    };
  }
}
