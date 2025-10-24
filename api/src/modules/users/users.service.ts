import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Photo } from './entities/photo.entity';
import { Match } from '../matching/entities/match.entity';
import { Like } from '../matching/entities/like.entity';
import { Pass } from '../matching/entities/pass.entity';
import { Message } from '../chat/entities/message.entity';
import { AlterMessage } from '../alter-chat/entities/alter-message.entity';
import { PhotosService } from './photos.service';
import { CompatibilityService } from '../matching/compatibility.service';
import { calculateProfileHash } from '../../utils/profile-hash.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Pass)
    private readonly passRepository: Repository<Pass>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(AlterMessage)
    private readonly alterMessageRepository: Repository<AlterMessage>,
    private readonly photosService: PhotosService,
    @Inject(forwardRef(() => CompatibilityService))
    private readonly compatibilityService: CompatibilityService,
  ) {}

  async findById(id: string, includePhotos = true): Promise<User> {
    const relations = includePhotos ? ['photos'] : [];
    const user = await this.userRepository.findOne({
      where: { id },
      relations,
      order: includePhotos ? { photos: { order: 'ASC' } } : undefined,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Get user with photos as signed URLs
   */
  async getUserWithPhotosUrls(id: string): Promise<any> {
    const user = await this.findById(id, true);
    const photos = user.photos || [];

    const photosWithUrls = photos.map(photo => ({
      id: photo.id,
      url: this.photosService.generateSignedUrl(photo.id),
      isPrimary: photo.isPrimary,
      order: photo.order,
    }));

    // Convert to plain object and add photos URLs
    const { photos: _, ...userWithoutPhotos } = user as any;
    return {
      ...userWithoutPhotos,
      images: photosWithUrls.map(p => p.url), // For backward compatibility
      photos: photosWithUrls,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // Récupérer le profil actuel pour comparer les hash
    const userBefore = await this.findById(id, false);
    const hashBefore = calculateProfileHash(userBefore);

    // Effectuer la mise à jour
    await this.userRepository.update(id, data);
    const userAfter = await this.findById(id, false);
    const hashAfter = calculateProfileHash(userAfter);

    // Si le hash a changé, invalider le cache de compatibilité
    if (hashBefore !== hashAfter) {
      this.logger.log(`Profile hash changed for user ${id}, invalidating compatibility cache`);
      const invalidatedCount = await this.compatibilityService.invalidateUserCache(id);
      this.logger.log(`Invalidated ${invalidatedCount} compatibility cache entries`);
    }

    return this.findById(id);
  }

  async updateLastActive(id: string): Promise<void> {
    await this.userRepository.update(id, { lastActiveAt: new Date() });
  }

  /**
   * Delete user account and all associated data
   * Deletes in order to respect foreign key constraints:
   * 1. ALTER chat messages
   * 2. Chat messages (where user is sender or receiver)
   * 3. Matches (where user is involved)
   * 4. Likes (sent and received)
   * 5. Passes
   * 6. Compatibility cache
   * 7. Photos
   * 8. User
   */
  async deleteAccount(id: string): Promise<void> {
    const user = await this.findById(id, false);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete all ALTER chat messages
    await this.alterMessageRepository.delete({ userId: id });

    // Delete all messages where user is sender or receiver
    await this.messageRepository.delete({ senderId: id });
    await this.messageRepository.delete({ receiverId: id });

    // Delete all matches where user is involved (both sides)
    await this.matchRepository.delete({ userId: id });
    await this.matchRepository.delete({ matchedUserId: id });

    // Delete all likes sent by user
    await this.likeRepository.delete({ userId: id });
    // Delete all likes received by user
    await this.likeRepository.delete({ likedUserId: id });

    // Delete all passes sent by user
    await this.passRepository.delete({ userId: id });
    // Delete all passes received by user
    await this.passRepository.delete({ passedUserId: id });

    // Delete all compatibility cache entries
    const deletedCacheCount = await this.compatibilityService.invalidateUserCache(id);
    this.logger.log(`Deleted ${deletedCacheCount} compatibility cache entries for user ${id}`);

    // Delete all user photos
    await this.photoRepository.delete({ userId: id });

    // Finally, delete the user
    await this.userRepository.delete(id);
  }
}
