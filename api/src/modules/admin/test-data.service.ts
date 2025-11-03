import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Gender } from '../users/entities/user.entity';
import { Match } from '../matching/entities/match.entity';
import { Like } from '../matching/entities/like.entity';
import { Message } from '../chat/entities/message.entity';
import { CompatibilityCache } from '../matching/entities/compatibility-cache.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PhotosService } from '../users/photos.service';
import axios from 'axios';

interface GenerateDataOptions {
  usersCount?: number;
  withProfiles?: boolean;
  withMatches?: boolean;
  withLikes?: boolean;
  withMessages?: boolean;
}

@Injectable()
export class TestDataService {
  private readonly logger = new Logger(TestDataService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(CompatibilityCache)
    private readonly compatibilityCacheRepository: Repository<CompatibilityCache>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly photosService: PhotosService,
  ) {}

  /**
   * Génère des utilisateurs de test avec profils complets
   */
  async generateTestData(options: GenerateDataOptions = {}, currentUserId?: string) {
    const {
      usersCount = 20,
      withProfiles = true,
      withMatches = true,
      withLikes = true,
      withMessages = true,
    } = options;

    // Supprimer les données de test existantes pour éviter les doublons
    this.logger.log('🧹 Nettoyage des données de test existantes...');
    await this.clearTestData();

    // Récupérer les préférences de l'utilisateur connecté
    let currentUser: User | null = null;
    if (currentUserId) {
      currentUser = await this.usersRepository.findOne({ where: { id: currentUserId } });
      if (currentUser) {
        this.logger.log(`👤 Génération de profils adaptés pour ${currentUser.name}`);
        this.logger.log(`   - Recherche: ${currentUser.preferenceGenders?.join(', ') || 'tous genres'}`);
        this.logger.log(`   - Age: ${currentUser.preferenceAgeMin || 18}-${currentUser.preferenceAgeMax || 99} ans`);
      }
    }

    this.logger.log(`🚀 Génération de ${usersCount} utilisateurs de test...`);

    const createdUsers: User[] = [];

    // Générer les utilisateurs adaptés aux préférences
    for (let i = 0; i < usersCount; i++) {
      const user = await this.generateUser(i, withProfiles, currentUser);
      createdUsers.push(user);
    }

    this.logger.log(`✅ ${createdUsers.length} utilisateurs créés`);

    // Générer les embeddings pour permettre la recherche vectorielle
    if (withProfiles) {
      this.logger.log('🔄 Génération des embeddings pour la recherche...');
      let embeddingsGenerated = 0;
      for (const user of createdUsers) {
        try {
          const profileText = this.formatUserProfileForEmbedding(user);
          const embedding = await this.embeddingsService.generateEmbedding(profileText);

          await this.usersRepository.update(user.id, {
            profileEmbedding: embedding,
            profileEmbeddingUpdatedAt: new Date(),
          });
          embeddingsGenerated++;
        } catch (error) {
          this.logger.warn(`Erreur lors de la génération d'embedding pour ${user.name}: ${error.message}`);
        }
      }
      this.logger.log(`✅ ${embeddingsGenerated} embeddings générés`);
    }

    // Générer les likes (incluant ceux avec l'utilisateur connecté)
    if (withLikes) {
      const likesCount = await this.generateLikes(createdUsers, currentUser);
      this.logger.log(`✅ ${likesCount} likes créés`);
    }

    // Générer les matches (incluant ceux avec l'utilisateur connecté)
    if (withMatches) {
      const matchesCount = await this.generateMatches(createdUsers, currentUser);
      this.logger.log(`✅ ${matchesCount} matches créés`);
    }

    // Générer les messages
    if (withMessages) {
      const messagesCount = await this.generateMessages(createdUsers);
      this.logger.log(`✅ ${messagesCount} messages créés`);
    }

    return {
      users: createdUsers.length,
      message: 'Données de test générées avec succès',
    };
  }

  /**
   * Génère un utilisateur de test
   */
  private async generateUser(index: number, withProfile: boolean, targetUser?: User | null): Promise<User> {
    const genders = ['male', 'female', 'other'];
    const searchObjectives = ['friendship', 'serious', 'casual'];

    const firstNames = {
      male: ['Thomas', 'Lucas', 'Hugo', 'Louis', 'Nathan', 'Arthur', 'Paul', 'Jules', 'Gabriel', 'Léo'],
      female: ['Emma', 'Léa', 'Chloé', 'Camille', 'Sarah', 'Marie', 'Laura', 'Julie', 'Alice', 'Manon'],
      other: ['Alex', 'Charlie', 'Sam', 'Jordan', 'Morgan', 'Riley', 'Casey', 'Drew', 'Quinn', 'Sage'],
    };

    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'];

    const interests = [
      'Music', 'Sports', 'Travel', 'Cinema', 'Reading', 'Cooking', 'Photography', 'Art', 'Gaming', 'Yoga',
      'Hiking', 'Dancing', 'Tech', 'Fashion', 'Food', 'Nature', 'Fitness', 'Design', 'Writing', 'Meditation'
    ];

    // Adapter le genre aux préférences de l'utilisateur cible (80% de chance)
    let gender: 'male' | 'female' | 'other';
    if (targetUser?.preferenceGenders && Array.isArray(targetUser.preferenceGenders) && targetUser.preferenceGenders.length > 0 && Math.random() < 0.8) {
      const preferredGenders = targetUser.preferenceGenders as ('male' | 'female' | 'other')[];
      gender = preferredGenders[Math.floor(Math.random() * preferredGenders.length)];
    } else {
      gender = genders[Math.floor(Math.random() * genders.length)] as 'male' | 'female' | 'other';
    }

    // Validation et fallback pour éviter les valeurs invalides
    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      gender = 'male';
    }

    const firstNamesList = firstNames[gender] || firstNames.male;
    const firstName = firstNamesList[Math.floor(Math.random() * firstNamesList.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    // Adapter l'âge aux préférences de l'utilisateur cible (80% de chance)
    let birthDate: Date;
    let age: number;

    if (targetUser?.preferenceAgeMin && targetUser?.preferenceAgeMax && Math.random() < 0.8) {
      // Générer un âge dans la fourchette préférée
      const targetAge = targetUser.preferenceAgeMin + Math.floor(Math.random() * (targetUser.preferenceAgeMax - targetUser.preferenceAgeMin + 1));
      const birthYear = new Date().getFullYear() - targetAge;
      birthDate = this.randomDate(new Date(birthYear, 0, 1), new Date(birthYear, 11, 31));
      age = this.calculateAge(birthDate);
    } else {
      birthDate = this.randomDate(new Date(1980, 0, 1), new Date(2003, 0, 1));
      age = this.calculateAge(birthDate);
    }

    const user = this.usersRepository.create({
      email: `test.user${index}@alter.test`,
      name: `${firstName} ${lastName}`,
      firstName,
      birthDate,
      age,
      gender: gender as Gender,
      city: cities[Math.floor(Math.random() * cities.length)],
      emailVerified: true,
      onboardingComplete: withProfile,
    });

    if (withProfile) {
      // Profil complet
      user.searchObjectives = this.randomItems(searchObjectives, 1, 3) as any;

      // Générer preferenceGenders avec adaptation à l'utilisateur cible (70% de chance)
      if (targetUser?.gender && Math.random() < 0.7) {
        // Inclure le genre de l'utilisateur cible dans les préférences
        const includeTargetGender = Math.random() < 0.8;
        if (includeTargetGender) {
          if (Math.random() < 0.6) {
            // Uniquement le genre cible
            user.preferenceGenders = [targetUser.gender] as any;
          } else {
            // Le genre cible + autres
            user.preferenceGenders = ['male', 'female'] as any;
          }
        } else {
          // Genre aléatoire
          const prefGenderChoice = Math.random();
          if (prefGenderChoice < 0.4) {
            user.preferenceGenders = ['male'] as any;
          } else if (prefGenderChoice < 0.8) {
            user.preferenceGenders = ['female'] as any;
          } else {
            user.preferenceGenders = ['male', 'female'] as any;
          }
        }
      } else {
        // Genre aléatoire si pas d'utilisateur cible
        const prefGenderChoice = Math.random();
        if (prefGenderChoice < 0.4) {
          user.preferenceGenders = ['male'] as any;
        } else if (prefGenderChoice < 0.8) {
          user.preferenceGenders = ['female'] as any;
        } else {
          user.preferenceGenders = ['male', 'female'] as any;
        }
      }

      // Adapter la tranche d'âge pour inclure l'utilisateur cible (70% de chance)
      if (targetUser?.age && Math.random() < 0.7) {
        // Créer une fourchette qui inclut l'âge de l'utilisateur cible
        const spread = 5 + Math.floor(Math.random() * 15); // 5-20 ans d'écart
        user.preferenceAgeMin = Math.max(18, targetUser.age - spread);
        user.preferenceAgeMax = Math.min(99, targetUser.age + spread);
      } else {
        user.preferenceAgeMin = 18 + Math.floor(Math.random() * 10);
        user.preferenceAgeMax = user.preferenceAgeMin + 10 + Math.floor(Math.random() * 20);
      }

      user.preferenceDistance = [50, 100, 200, 500][Math.floor(Math.random() * 4)];
      user.interests = this.randomItems(interests, 3, 8);

      // Profil ALTER avec données AI
      user.alterProfileAI = {
        personnalité: this.generatePersonality(),
        intention: user.searchObjectives?.[0] || 'friendship',
        identité: this.generateIdentity(gender),
        amitié: this.generateFriendshipStyle(),
        amour: this.generateLoveStyle(),
        sexualité: this.generateSexualityStyle(),
      };

      user.alterSummary = this.generateSummary(firstName, user.alterProfileAI);
      user.alterProfileCompletion = 85 + Math.floor(Math.random() * 15);

      // Générer une bio basée sur les intérêts et la personnalité
      user.bio = this.generateBio(user.interests, user.alterProfileAI);
    }

    const savedUser = await this.usersRepository.save(user);

    // Générer les photos dans la table photos
    await this.generateProfilePhotos(savedUser.id, firstName, lastName, gender, index);

    return savedUser;
  }

  /**
   * Génère des likes aléatoires entre utilisateurs
   */
  private async generateLikes(users: User[], targetUser?: User | null): Promise<number> {
    const likes: Like[] = [];

    // Si un utilisateur cible est défini, créer des likes entre lui et les utilisateurs générés
    if (targetUser) {
      // L'utilisateur cible like 60% des profils générés
      const likedByTarget = users.filter(() => Math.random() < 0.6);
      for (const user of likedByTarget) {
        likes.push(
          this.likesRepository.create({
            userId: targetUser.id,
            likedUserId: user.id,
          }),
        );
      }

      // 50% des profils générés like l'utilisateur cible (pour créer des matches mutuels)
      const likingTarget = users.filter(() => Math.random() < 0.5);
      for (const user of likingTarget) {
        likes.push(
          this.likesRepository.create({
            userId: user.id,
            likedUserId: targetUser.id,
          }),
        );
      }

      this.logger.log(`   - ${likedByTarget.length} profils likés par vous`);
      this.logger.log(`   - ${likingTarget.length} profils vous ont liké`);
    }

    // Likes entre utilisateurs de test
    for (const user of users) {
      const likeCount = 3 + Math.floor(Math.random() * 7);
      const targets = this.randomItems(users.filter(u => u.id !== user.id), likeCount);

      for (const target of targets) {
        likes.push(
          this.likesRepository.create({
            userId: user.id,
            likedUserId: target.id,
          }),
        );
      }
    }

    await this.likesRepository.save(likes);
    return likes.length;
  }

  /**
   * Génère des matches (likes mutuels)
   */
  private async generateMatches(users: User[], targetUser?: User | null): Promise<number> {
    const matches: Match[] = [];

    // Si un utilisateur cible est défini, créer des matches avec lui
    if (targetUser) {
      // Créer des matches avec 30-40% des profils générés
      const matchingUsers = users.filter(() => Math.random() < 0.35);

      for (const user of matchingUsers) {
        const matchedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

        // Générer les scores de compatibilité
        const compatibility = this.generateCompatibilityScores(targetUser, user);

        // Match bidirectionnel avec scores de compatibilité
        matches.push(
          this.matchesRepository.create({
            userId: targetUser.id,
            matchedUserId: user.id,
            matchedAt,
            compatibilityScoreGlobal: compatibility.global,
            compatibilityScoreLove: compatibility.love,
            compatibilityScoreFriendship: compatibility.friendship,
            compatibilityScoreCarnal: compatibility.carnal,
            compatibilityInsight: compatibility.insight,
            conversationQualityScore: 50 + Math.floor(Math.random() * 30), // 50-80
          }),
        );

        matches.push(
          this.matchesRepository.create({
            userId: user.id,
            matchedUserId: targetUser.id,
            matchedAt,
            compatibilityScoreGlobal: compatibility.global,
            compatibilityScoreLove: compatibility.love,
            compatibilityScoreFriendship: compatibility.friendship,
            compatibilityScoreCarnal: compatibility.carnal,
            compatibilityInsight: compatibility.insight,
            conversationQualityScore: 50 + Math.floor(Math.random() * 30),
          }),
        );
      }

      this.logger.log(`   - ${matchingUsers.length} matches créés avec vous`);
    }

    // Créer des matches entre utilisateurs de test
    for (let i = 0; i < users.length - 1; i++) {
      // 25% de chance de match avec l'utilisateur suivant
      if (Math.random() < 0.25) {
        const matchedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const compatibility = this.generateCompatibilityScores(users[i], users[i + 1]);

        matches.push(
          this.matchesRepository.create({
            userId: users[i].id,
            matchedUserId: users[i + 1].id,
            matchedAt,
            compatibilityScoreGlobal: compatibility.global,
            compatibilityScoreLove: compatibility.love,
            compatibilityScoreFriendship: compatibility.friendship,
            compatibilityScoreCarnal: compatibility.carnal,
            compatibilityInsight: compatibility.insight,
            conversationQualityScore: 50 + Math.floor(Math.random() * 30),
          }),
        );

        matches.push(
          this.matchesRepository.create({
            userId: users[i + 1].id,
            matchedUserId: users[i].id,
            matchedAt,
            compatibilityScoreGlobal: compatibility.global,
            compatibilityScoreLove: compatibility.love,
            compatibilityScoreFriendship: compatibility.friendship,
            compatibilityScoreCarnal: compatibility.carnal,
            compatibilityInsight: compatibility.insight,
            conversationQualityScore: 50 + Math.floor(Math.random() * 30),
          }),
        );
      }
    }

    await this.matchesRepository.save(matches);
    return matches.length;
  }

  /**
   * Génère des scores de compatibilité réalistes entre deux utilisateurs
   */
  private generateCompatibilityScores(user1: User, user2: User): {
    global: number;
    love: number;
    friendship: number;
    carnal: number;
    insight: string;
  } {
    // Calculer les scores en fonction des profils
    const user1AI = user1.alterProfileAI || {};
    const user2AI = user2.alterProfileAI || {};

    // Score d'amitié (basé sur personnalité et intérêts communs)
    const commonInterests = (user1.interests || []).filter(i => (user2.interests || []).includes(i)).length;
    const friendshipBase = 60 + Math.floor(Math.random() * 30);
    const friendship = Math.min(95, friendshipBase + commonInterests * 3);

    // Score amoureux (basé sur style amoureux et personnalité)
    const loveBase = 55 + Math.floor(Math.random() * 35);
    const love = Math.min(95, loveBase);

    // Score charnel (basé sur compatibilité sexuelle)
    const carnalBase = 50 + Math.floor(Math.random() * 40);
    const carnal = Math.min(95, carnalBase);

    // Score global (moyenne pondérée)
    const global = Math.floor((friendship * 0.3 + love * 0.4 + carnal * 0.3));

    // Générer un insight personnalisé
    const insights = [
      `Vous partagez ${commonInterests} intérêt(s) commun(s) et vos personnalités semblent complémentaires. ${user1AI.personnalité || 'Votre profil'} s'harmonise bien avec ${user2AI.personnalité?.toLowerCase() || 'son profil'}.`,
      `Votre approche ${user1AI.amour?.toLowerCase() || 'en amour'} résonne avec ${user2AI.amour?.toLowerCase() || 'la sienne'}. En amitié, ${user2AI.amitié?.toLowerCase() || 'votre style'} pourrait créer une belle connexion.`,
      `ALTER détecte une belle synergie entre vos profils. Vos ${commonInterests > 2 ? 'nombreux' : ''} intérêts communs (${(user1.interests || []).filter(i => (user2.interests || []).includes(i)).slice(0, 3).join(', ')}) sont un excellent point de départ.`,
      `Votre compatibilité repose sur un équilibre entre ${user1AI.intention || 'vos intentions'} et ${user2AI.intention || 'les siennes'}. ${user1AI.personnalité || 'Votre personnalité'} et ${user2AI.personnalité?.toLowerCase() || 'la sienne'} se complètent naturellement.`,
      `ALTER a identifié des valeurs communes dans vos profils. En particulier, vos approches en ${user1AI.amitié?.toLowerCase() || 'amitié'} et ${user2AI.amour?.toLowerCase() || 'en amour'} suggèrent une bonne entente.`,
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

  /**
   * Génère des messages pour les matches
   */
  private async generateMessages(users: User[]): Promise<number> {
    const matches = await this.matchesRepository.find();
    const messages: Message[] = [];

    const sampleMessages = [
      'Salut ! Comment vas-tu ?',
      'Hey ! Ton profil est super intéressant 😊',
      'Coucou ! On a beaucoup de points communs !',
      'Salut, ça te dit de discuter ?',
      'Hello ! Tu fais quoi de beau ?',
      'Salut ! J\'ai vu qu\'on aimait tous les deux la musique !',
      'Hey ! Tu es aussi de Paris ?',
      'Coucou ! Ravie de matcher avec toi 🌟',
    ];

    for (const match of matches) {
      // 70% de chance qu'il y ait des messages
      if (Math.random() < 0.7) {
        const messageCount = 2 + Math.floor(Math.random() * 10);

        for (let i = 0; i < messageCount; i++) {
          const senderId = i % 2 === 0 ? match.userId : match.matchedUserId;
          const receiverId = i % 2 === 0 ? match.matchedUserId : match.userId;

          const message = this.messagesRepository.create({
            matchId: match.id,
            senderId,
            receiverId,
            content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
            createdAt: new Date(match.matchedAt.getTime() + i * 3600000), // 1h entre chaque message
            read: Math.random() < 0.5, // 50% de chance que le message soit lu
          });

          messages.push(message);
        }
      }
    }

    await this.messagesRepository.save(messages);
    return messages.length;
  }

  /**
   * Formate le profil utilisateur pour générer l'embedding
   */
  private formatUserProfileForEmbedding(user: User): string {
    const basicInfo = `Nom: ${user.name}, Age: ${user.age}, Genre: ${user.gender}`;

    let profile = basicInfo;

    if (user.alterSummary) {
      profile += `\n\nRésumé: ${user.alterSummary}`;
    }

    if (user.interests?.length > 0) {
      profile += `\nIntérêts: ${user.interests.join(', ')}`;
    }

    if (user.searchObjectives?.length > 0) {
      profile += `\nRecherche: ${user.searchObjectives.join(', ')}`;
    }

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
   * Supprime toutes les données de test
   */
  async clearTestData(): Promise<void> {
    this.logger.log('🗑️  Suppression des données de test...');

    // Récupérer les utilisateurs de test
    const testUsers = await this.usersRepository
      .createQueryBuilder()
      .where('email LIKE :pattern', { pattern: '%@alter.test' })
      .getMany();

    if (testUsers.length === 0) {
      this.logger.log('✅ Aucune donnée de test à supprimer');
      return;
    }

    const testUserIds = testUsers.map(u => u.id);

    // Supprimer les messages liés aux matches de test users
    const deleteMessagesResult = await this.messagesRepository
      .createQueryBuilder()
      .delete()
      .where('senderId IN (:...ids) OR receiverId IN (:...ids)', { ids: testUserIds })
      .execute();
    this.logger.log(`✅ ${deleteMessagesResult.affected || 0} messages supprimés`);

    // Supprimer les matches des test users
    const deleteMatchesResult = await this.matchesRepository
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids) OR matchedUserId IN (:...ids)', { ids: testUserIds })
      .execute();
    this.logger.log(`✅ ${deleteMatchesResult.affected || 0} matches supprimés`);

    // Supprimer les likes des test users
    const deleteLikesResult = await this.likesRepository
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids) OR likedUserId IN (:...ids)', { ids: testUserIds })
      .execute();
    this.logger.log(`✅ ${deleteLikesResult.affected || 0} likes supprimés`);

    // Supprimer le cache de compatibilité des test users
    const deleteCompatibilityCacheResult = await this.compatibilityCacheRepository
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids) OR targetUserId IN (:...ids)', { ids: testUserIds })
      .execute();
    this.logger.log(`✅ ${deleteCompatibilityCacheResult.affected || 0} entrées de cache de compatibilité supprimées`);

    // Supprimer les utilisateurs de test
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .where('email LIKE :pattern', { pattern: '%@alter.test' })
      .execute();

    this.logger.log(`✅ ${testUsers.length} utilisateurs de test supprimés`);
  }

  /**
   * Supprime TOUTES les données (attention !)
   */
  async clearAllData(): Promise<void> {
    this.logger.warn('⚠️  SUPPRESSION DE TOUTES LES DONNÉES...');

    await this.messagesRepository.delete({});
    await this.matchesRepository.delete({});
    await this.likesRepository.delete({});
    await this.compatibilityCacheRepository.delete({});
    await this.usersRepository.delete({});

    this.logger.log('✅ Toutes les données ont été supprimées');
  }

  // Utilitaires
  private randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private randomItems<T>(array: T[], min: number, max?: number): T[] {
    const count = max ? min + Math.floor(Math.random() * (max - min + 1)) : min;
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  private generatePersonality(): string {
    const traits = [
      'Créatif et spontané',
      'Analytique et réfléchi',
      'Sociable et extraverti',
      'Calme et introverti',
      'Aventureux et audacieux',
      'Méthodique et organisé',
      'Empathique et bienveillant',
      'Indépendant et déterminé',
    ];
    return traits[Math.floor(Math.random() * traits.length)];
  }

  private generateIdentity(gender: string): string {
    const identities = {
      male: ['Homme cisgenre', 'Homme transgenre', 'Non-binaire'],
      female: ['Femme cisgenre', 'Femme transgenre', 'Non-binaire'],
      other: ['Non-binaire', 'Genderfluid', 'Agenre'],
    };
    const options = identities[gender] || identities.other;
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateFriendshipStyle(): string {
    const styles = [
      'Recherche des amitiés profondes et authentiques',
      'Préfère les groupes et les activités sociales',
      'Aime les conversations intellectuelles',
      'Privilégie les amitiés basées sur des activités communes',
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private generateLoveStyle(): string {
    const styles = [
      'Romantique et passionné',
      'Pragmatique et stable',
      'Indépendant mais affectueux',
      'Cherche une connexion profonde',
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private generateSexualityStyle(): string {
    const styles = [
      'Hétérosexuel',
      'Homosexuel',
      'Bisexuel',
      'Pansexuel',
      'Asexuel',
      'Demisexuel',
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private generateSummary(name: string, profile: any): string {
    const safeProfile = profile || {};
    return `${name} est une personne ${(safeProfile.personnalité || 'authentique').toLowerCase()}. ${safeProfile.amitié || 'Cherche des amitiés sincères'}. En amour, ${(safeProfile.amour || 'cherche connexion profonde').toLowerCase()}. Recherche principalement ${safeProfile.intention || 'friendship'}.`;
  }

  private generateBio(interests: string[], profileAI: any): string {
    const safeInterests = interests || [];
    const safeProfile = profileAI || {};

    const bioTemplates = [
      `Passionné(e) par ${safeInterests.slice(0, 2).join(' et ')}, je cherche à rencontrer des personnes authentiques. ${safeProfile.personnalité || 'Ouvert d\'esprit'}. 🌟`,
      `Fan de ${safeInterests[0] || 'découverte'} et ${safeInterests[1] || 'aventure'}, j'aime profiter de chaque moment. ${safeProfile.amour || 'Cherche connexions authentiques'}. ✨`,
      `${safeProfile.personnalité || 'Créatif et spontané'}. Amateur(trice) de ${safeInterests.slice(0, 3).join(', ') || 'nouvelles expériences'}. Toujours partant(e) pour de nouvelles aventures ! 🚀`,
      `La vie est trop courte pour ne pas être soi-même ! J'adore ${safeInterests[0] || 'découvrir'}, ${safeInterests[1] || 'explorer'} et rencontrer de nouvelles personnes. 💫`,
      `${safeProfile.amitié || 'Cherche amitiés sincères'}. Mes passions : ${safeInterests.slice(0, 2).join(' & ') || 'les belles rencontres'}. Cherche des connexions authentiques. 🌈`,
      `Curieux(se) de nature, j'aime ${safeInterests.slice(0, 2).join(', ') || 'la vie'} et les belles conversations. ${safeProfile.personnalité || 'Authentique'}. 🎨`,
    ];

    return bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
  }

  /**
   * Génère et enregistre les photos de profil dans la table photos
   */
  private async generateProfilePhotos(
    userId: string,
    firstName: string,
    lastName: string,
    gender: string,
    index: number,
  ): Promise<void> {
    // Utiliser DiceBear Avatars - API gratuite pour générer des avatars
    // Différents styles selon le genre
    const styles: Record<string, string[]> = {
      male: ['avataaars', 'big-smile', 'micah'],
      female: ['avataaars', 'big-smile', 'micah'],
      other: ['bottts', 'identicon', 'shapes'],
    };

    const styleList = styles[gender] || styles.male;
    const selectedStyle = styleList[Math.floor(Math.random() * styleList.length)];

    // Seed basé sur le nom pour avoir des avatars cohérents et reproductibles
    const seed = `${firstName}-${lastName}-${index}`;

    // Générer 3-6 images avec différentes variations
    const imageCount = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < imageCount; i++) {
      try {
        // Ajouter un suffixe pour varier les images
        const imageSeed = `${seed}-${i}`;
        const imageUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(imageSeed)}`;

        // Télécharger l'image SVG
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });

        // Créer la photo dans la base de données
        await this.photosService.createPhoto(
          userId,
          {
            data: Buffer.from(response.data),
            mimeType: 'image/svg+xml',
            filename: `avatar-${imageSeed}.svg`,
            size: response.data.length,
          },
          i, // order
          i === 0, // isPrimary (première photo)
        );
      } catch (error) {
        this.logger.warn(`Erreur lors du téléchargement de la photo ${i} pour ${firstName}: ${error.message}`);
      }
    }
  }
}
