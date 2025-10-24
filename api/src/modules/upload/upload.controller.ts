import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PhotosService } from '../users/photos.service';
import { ParametersService } from '../parameters/parameters.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly photosService: PhotosService,
    private readonly parametersService: ParametersService,
  ) {}

  @Post('photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Check max photos limit
    const maxPhotos = await this.parametersService.get<number>('upload.max_photos_per_user');
    const currentPhotos = await this.photosService.getUserPhotos(user.id);

    if (currentPhotos.length >= maxPhotos) {
      throw new BadRequestException(`Vous ne pouvez pas avoir plus de ${maxPhotos} photos`);
    }

    const fileData = this.uploadService.prepareFileData(file);
    const photo = await this.photosService.createPhoto(user.id, fileData);
    return {
      id: photo.id,
      url: `/upload/photo/${photo.id}`,
      mimeType: photo.mimeType,
      size: photo.size,
      isPrimary: photo.isPrimary,
    };
  }

  @Post('photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 6))
  async uploadPhotos(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const filesData = this.uploadService.prepareFilesData(files);
    const photos = await this.photosService.createPhotos(user.id, filesData);

    return {
      photos: photos.map(photo => ({
        id: photo.id,
        url: `/upload/photo/${photo.id}`,
        mimeType: photo.mimeType,
        size: photo.size,
        order: photo.order,
        isPrimary: photo.isPrimary,
      })),
    };
  }

  @Get('photo/:id')
  async getPhoto(@Param('id') id: string, @Res() res: Response) {
    const photo = await this.photosService.getPhotoById(id);

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    res.set({
      'Content-Type': photo.mimeType,
      'Content-Length': photo.size,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    res.send(photo.data);
  }
}
