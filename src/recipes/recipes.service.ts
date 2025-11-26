import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';
import { CreateIngredientDto, CreateStepDto } from './dto/create-recipe.dto';

@Injectable()
export class RecipesService {
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Ambil base URL dari environment atau gunakan default
    const port = this.configService.get('PORT', 3850);
    this.baseUrl = this.configService.get('BASE_URL') || `http://localhost:${port}`;
  }

  /**
   * Helper: Transform recipe dengan full image URLs
   */
  private transformRecipeWithUrls(recipe: any) {
    if (!recipe) return recipe;

    return {
      ...recipe,
      // Transform mainImage ke full URL
      mainImage: recipe.mainImage 
        ? `${this.baseUrl}/uploads/recipes/${recipe.mainImage}`
        : null,
      
      // Transform user avatar
      user: recipe.user ? {
        ...recipe.user,
        avatar: recipe.user.avatar 
          ? `${this.baseUrl}/uploads/avatars/${recipe.user.avatar}`
          : null,
      } : recipe.user,
      
      // Transform step images
      steps: recipe.steps?.map((step: any) => ({
        ...step,
        image: step.image 
          ? `${this.baseUrl}/uploads/recipes/${step.image}`
          : null,
      })),

      // Transform reviews user avatars
      reviews: recipe.reviews?.map((review: any) => ({
        ...review,
        user: review.user ? {
          ...review.user,
          avatar: review.user.avatar 
            ? `${this.baseUrl}/uploads/avatars/${review.user.avatar}`
            : null,
        } : review.user,
      })),
    };
  }

  async create(userId: number, createRecipeDto: CreateRecipeDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const { ingredients, steps, ...recipeData } = createRecipeDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const recipe = await this.prisma.recipe.create({
      data: {
        ...recipeData,
        user: {
          connect: { id: userId },
        },
        ingredients: {
          create: ingredients as CreateIngredientDto[],
        },
        steps: {
          create: steps as CreateStepDto[],
        },
      },
      include: {
        ingredients: true,
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            reviews: true,
          },
        },
      },
    });

    // Transform dengan full URLs
    return this.transformRecipeWithUrls(recipe);
  }

  async findAll(
    userId?: number,
    options?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { category, search, page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    // Build where clause dengan logika yang lebih sederhana
    const where: any = {};

    // Filter visibility: show public recipes OR user's own recipes
    if (userId) {
      // Jika user login, tampilkan public recipes + recipes milik user
      where.OR = [
        { isPublic: true },
        { userId: userId }
      ];
    } else {
      // Jika guest, hanya tampilkan public recipes
      where.isPublic = true;
    }

    // Filter berdasarkan category (optional)
    if (category && category.trim() !== '') {
      where.category = category;
    }

    // Filter berdasarkan search (optional)
    if (search && search.trim() !== '') {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        include: {
          ingredients: true,
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              favorites: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    // Transform semua recipes dengan full URLs
    const transformedRecipes = recipes.map((recipe) =>
      this.transformRecipeWithUrls(recipe),
    );

    return {
      data: transformedRecipes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId?: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            favorites: true,
            reviews: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    if (!recipe.isPublic && (!userId || recipe.userId !== userId)) {
      throw new ForbiddenException('You do not have access to this recipe');
    }

    // Transform dengan full URLs
    return this.transformRecipeWithUrls(recipe);
  }

  async update(id: number, userId: number, updateRecipeDto: UpdateRecipeDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    const { ingredients, steps, ...recipeData } = updateRecipeDto;

    if (ingredients) {
      await this.prisma.ingredient.deleteMany({
        where: { recipeId: id },
      });
    }

    if (steps) {
      await this.prisma.recipeStep.deleteMany({
        where: { recipeId: id },
      });
    }

    const updatedRecipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        ...(ingredients && {
          ingredients: { create: ingredients as CreateIngredientDto[] },
        }),
        ...(steps && {
          steps: { create: steps as CreateStepDto[] },
        }),
      },
      include: {
        ingredients: true,
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Transform dengan full URLs
    return this.transformRecipeWithUrls(updatedRecipe);
  }

  async remove(id: number, userId: number) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    return this.prisma.recipe.delete({
      where: { id },
    });
  }

  async toggleFavorite(recipeId: number, userId: number) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    await this.findOne(recipeId, userId);

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return { isFavorite: false, message: 'Removed from favorites' };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          recipeId,
        },
      });
      return { isFavorite: true, message: 'Added to favorites' };
    }
  }

  async addReview(
    recipeId: number,
    userId: number,
    rating: number,
    comment?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    await this.findOne(recipeId, userId);

    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    let review;
    if (existingReview) {
      review = await this.prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, comment },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    } else {
      review = await this.prisma.review.create({
        data: {
          userId,
          recipeId,
          rating,
          comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    }

    // Transform user avatar
    if (review.user?.avatar) {
      review.user.avatar = `${this.baseUrl}/uploads/avatars/${review.user.avatar}`;
    }

    return review;
  }

  async deleteReview(recipeId: number, userId: number) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const review = await this.prisma.review.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return this.prisma.review.delete({
      where: { id: review.id },
    });
  }
}