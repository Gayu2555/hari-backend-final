// src/common/services/image.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';

// Fix: Import sharp dengan default import
import sharp from 'sharp';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads', 'recipes');

  /**
   * Optimize image: resize and compress
   * @param filename - Original filename
   * @param maxWidth - Maximum width (default: 1920)
   * @param quality - JPEG quality 1-100 (default: 85)
   */
  async optimizeImage(
    filename: string,
    maxWidth: number = 1920,
    quality: number = 85,
  ): Promise<string> {
    const inputPath = join(this.uploadDir, filename);
    const outputFilename = `optimized-${filename}`;
    const outputPath = join(this.uploadDir, outputFilename);

    try {
      this.logger.debug(`Optimizing image: ${filename}`);

      await sharp(inputPath)
        .resize(maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({ quality, progressive: true })
        .png({ quality, progressive: true })
        .webp({ quality })
        .toFile(outputPath);

      // Delete original file
      await fs.unlink(inputPath);

      this.logger.log(`✅ Image optimized: ${outputFilename}`);
      return outputFilename;
    } catch (error) {
      this.logger.error(`Error optimizing image ${filename}: ${error.message}`);
      // Return original filename if optimization fails
      return filename;
    }
  }

  /**
   * Create thumbnail
   * @param filename - Original filename
   * @param width - Thumbnail width (default: 300)
   * @param height - Thumbnail height (default: 300)
   */
  async createThumbnail(
    filename: string,
    width: number = 300,
    height: number = 300,
  ): Promise<string> {
    const inputPath = join(this.uploadDir, filename);
    const thumbnailFilename = `thumb-${filename}`;
    const outputPath = join(this.uploadDir, thumbnailFilename);

    try {
      this.logger.debug(`Creating thumbnail: ${filename}`);

      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      this.logger.log(`✅ Thumbnail created: ${thumbnailFilename}`);
      return thumbnailFilename;
    } catch (error) {
      this.logger.error(
        `Error creating thumbnail ${filename}: ${error.message}`,
      );
      return filename;
    }
  }

  /**
   * Delete image file
   * @param filename - Filename to delete
   */
  async deleteImage(filename: string): Promise<void> {
    const filePath = join(this.uploadDir, filename);

    try {
      await fs.unlink(filePath);
      this.logger.log(`✅ Image deleted: ${filename}`);
    } catch (error) {
      this.logger.error(`Error deleting image ${filename}: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   * @param filenames - Array of filenames to delete
   */
  async deleteImages(filenames: string[]): Promise<void> {
    const promises = filenames.map((filename) => this.deleteImage(filename));
    await Promise.all(promises);
  }

  /**
   * Check if file exists
   * @param filename - Filename to check
   */
  async fileExists(filename: string): Promise<boolean> {
    const filePath = join(this.uploadDir, filename);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param filename - Filename to check
   */
  async getFileSize(filename: string): Promise<number> {
    const filePath = join(this.uploadDir, filename);
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      this.logger.error(
        `Error getting file size ${filename}: ${error.message}`,
      );
      return 0;
    }
  }
}
