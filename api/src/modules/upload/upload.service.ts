import { Injectable } from '@nestjs/common';

export interface FileData {
  data: Buffer;
  mimeType: string;
  filename: string;
  size: number;
}

@Injectable()
export class UploadService {
  /**
   * Prépare les données du fichier pour stockage en base de données
   */
  prepareFileData(file: Express.Multer.File): FileData {
    return {
      data: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname,
      size: file.size,
    };
  }

  /**
   * Prépare plusieurs fichiers pour stockage en base de données
   */
  prepareFilesData(files: Express.Multer.File[]): FileData[] {
    return files.map(file => this.prepareFileData(file));
  }
}
