import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { multerConfig } from '../config/multer.config';

@Module({
  imports: [MulterModule.register(multerConfig), PrismaModule],
  controllers: [RecipesController],
  providers: [RecipesService, PrismaService],
  exports: [RecipesService],
})
export class RecipesModule {}
