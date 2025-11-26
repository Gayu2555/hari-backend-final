// src/app.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AppService {
<<<<<<< HEAD
  getHello() {
    return {
      status: 'Backend is online!',
      timestamp: new Date().toISOString(),
    };
  }

  async testDatabase() {
    try {
      // Jalankan query sederhana
      await prisma.$queryRaw`SELECT 1 + 1 AS result`;
      return {
        database: '✅ Connected to MariaDB!',
        status: 'OK',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: '❌ Connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
=======
  getHello(): string {
    return 'Recipe Sharing API is running!';
  }

  getHealth(): object {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Recipe Sharing API',
      version: '1.0.0',
    };
  }

  getApiInfo(): object {
    return {
      name: 'sharerecipe-api berfungsi',
      description: 'A REST API Backend untuk ShareRecipe Application',
      version: '1.0.0',
      author: 'Gayu Yunma Ramadhan',
      endpoints: {
        auth: '/auth',
        users: '/users',
        recipes: '/recipes',
        ingredients: '/ingredients',
        favorites: '/favorites',
        reviews: '/reviews',
      },
    };
>>>>>>> fitur-baru
  }
}
