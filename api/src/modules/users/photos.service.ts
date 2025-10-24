import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import * as crypto from 'crypto';

export interface PhotoData {
  data: Buffer;
  mimeType: string;
  filename: string;
  size: number;
}

@Injectable()
export class PhotosService {
  private readonly secret = process.env.PHOTO_TOKEN_SECRET || 'default-photo-secret-change-in-production';
  private readonly tokenTTL = 3600 * 1000; // 1 hour

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  generateSignedUrl(photoId: string): string {
    const expiresAt = Date.now() + this.tokenTTL;
    const payload = `${photoId}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    return `/photos/${photoId}?token=${signature}&expires=${expiresAt}`;
  }

  verifySignedUrl(photoId: string, token: string, expires: string): boolean {
    try {
      const expiresAt = parseInt(expires, 10);

      // Check expiration
      if (Date.now() > expiresAt) {
        return false;
      }

      // Verify signature
      const payload = `${photoId}:${expiresAt}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('hex');

      return token === expectedSignature;
    } catch {
      return false;
    }
  }

  async createPhoto(userId: string, photoData: PhotoData, order: number = 0, isPrimary: boolean = false): Promise<Photo> {
    const photo = this.photoRepository.create({
      userId,
      data: photoData.data,
      mimeType: photoData.mimeType,
      filename: photoData.filename,
      size: photoData.size,
      order,
      isPrimary,
    });
    return this.photoRepository.save(photo);
  }

  async createPhotos(userId: string, photosData: PhotoData[]): Promise<Photo[]> {
    // Set first photo as primary if no photos exist
    const existingPhotos = await this.getUserPhotos(userId);
    const isPrimaryFirst = existingPhotos.length === 0;

    const photos = photosData.map((photoData, index) =>
      this.photoRepository.create({
        userId,
        data: photoData.data,
        mimeType: photoData.mimeType,
        filename: photoData.filename,
        size: photoData.size,
        order: existingPhotos.length + index,
        isPrimary: isPrimaryFirst && index === 0,
      }),
    );

    return this.photoRepository.save(photos);
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    return this.photoRepository.findOne({
      where: { id: photoId },
    });
  }

  async getUserPhotos(userId: string): Promise<Photo[]> {
    return this.photoRepository.find({
      where: { userId },
      order: { order: 'ASC' },
    });
  }

  async deletePhoto(photoId: string, userId: string): Promise<void> {
    await this.photoRepository.delete({ id: photoId, userId });
  }

  async setPrimaryPhoto(photoId: string, userId: string): Promise<void> {
    // Remove primary from all user photos
    await this.photoRepository.update(
      { userId },
      { isPrimary: false },
    );

    // Set new primary photo
    await this.photoRepository.update(
      { id: photoId, userId },
      { isPrimary: true },
    );
  }

  async reorderPhotos(userId: string, photoIds: string[]): Promise<void> {
    const updates = photoIds.map((id, index) =>
      this.photoRepository.update({ id, userId }, { order: index }),
    );
    await Promise.all(updates);
  }

  async deleteAllUserPhotos(userId: string): Promise<void> {
    await this.photoRepository.delete({ userId });
  }

  async getUserPhotosCount(userId: string): Promise<number> {
    return this.photoRepository.count({
      where: { userId },
    });
  }

  async hasMinimumPhotos(userId: string, minPhotos: number): Promise<boolean> {
    const count = await this.getUserPhotosCount(userId);
    return count >= minPhotos;
  }
}
