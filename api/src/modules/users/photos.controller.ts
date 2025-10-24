import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Res,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { PhotosService } from './photos.service';

@Controller('photos')
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserPhotos(@CurrentUser() user: User) {
    const photos = await this.photosService.getUserPhotos(user.id);
    return photos.map(photo => ({
      id: photo.id,
      order: photo.order,
      isPrimary: photo.isPrimary,
      url: this.photosService.generateSignedUrl(photo.id),
      createdAt: photo.createdAt,
    }));
  }

  @Get(':id')
  async getPhoto(
    @Param('id') id: string,
    @Query('token') token: string,
    @Query('expires') expires: string,
    @Res() res: Response,
  ) {
    // Verify signed URL
    if (!token || !expires || !this.photosService.verifySignedUrl(id, token, expires)) {
      throw new UnauthorizedException('Invalid or expired photo token');
    }

    const photo = await this.photosService.getPhotoById(id);

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    res.set('Content-Type', photo.mimeType);
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.send(photo.data);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG and WebP are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB');
    }

    // Check if user already has 6 photos
    const existingPhotos = await this.photosService.getUserPhotos(user.id);
    if (existingPhotos.length >= 6) {
      throw new BadRequestException('Maximum 6 photos allowed');
    }

    const photoData = {
      data: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname,
      size: file.size,
    };

    const photo = await this.photosService.createPhoto(
      user.id,
      photoData,
      existingPhotos.length,
      existingPhotos.length === 0,
    );

    return {
      id: photo.id,
      order: photo.order,
      isPrimary: photo.isPrimary,
      url: this.photosService.generateSignedUrl(photo.id),
      createdAt: photo.createdAt,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const photo = await this.photosService.getPhotoById(id);

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.userId !== user.id) {
      throw new BadRequestException('You can only delete your own photos');
    }

    await this.photosService.deletePhoto(id, user.id);

    return { message: 'Photo deleted successfully' };
  }

  @Put(':id/primary')
  @UseGuards(JwtAuthGuard)
  async setPrimaryPhoto(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const photo = await this.photosService.getPhotoById(id);

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.userId !== user.id) {
      throw new BadRequestException('You can only set your own photos as primary');
    }

    await this.photosService.setPrimaryPhoto(id, user.id);

    return { message: 'Primary photo updated successfully' };
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  async reorderPhotos(
    @CurrentUser() user: User,
    @Body() body: { photoIds: string[] },
  ) {
    if (!body.photoIds || !Array.isArray(body.photoIds)) {
      throw new BadRequestException('Invalid photoIds array');
    }

    // Verify all photos belong to user
    const photos = await this.photosService.getUserPhotos(user.id);
    const userPhotoIds = photos.map(p => p.id);

    for (const photoId of body.photoIds) {
      if (!userPhotoIds.includes(photoId)) {
        throw new BadRequestException('Invalid photo ID');
      }
    }

    await this.photosService.reorderPhotos(user.id, body.photoIds);

    return { message: 'Photos reordered successfully' };
  }
}
