import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseIntPipe,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RecipesService } from './recipes.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateIngredientDto,
  CreateStepDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('recipes')
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly recipesService: RecipesService) {}

  private parseIngredients(body: any): CreateIngredientDto[] {
    this.logger.debug('=== PARSING INGREDIENTS ===');
    if (!body.ingredients) {
      throw new BadRequestException('Ingredients are required');
    }

    let parsedIngredients: any;
    try {
      if (typeof body.ingredients === 'string') {
        parsedIngredients = JSON.parse(body.ingredients);
        this.logger.debug('Ingredients parsed from JSON string.');
      } else if (Array.isArray(body.ingredients)) {
        parsedIngredients = body.ingredients;
        this.logger.debug('Ingredients already an array.');
      } else {
        throw new Error('Invalid ingredients format in request body.');
      }

      if (!Array.isArray(parsedIngredients)) {
        throw new Error('Ingredients data is not an array.');
      }

      const ingredients = parsedIngredients
        .filter((item) => item)
        .map((item): CreateIngredientDto | null => {
          if (typeof item === 'string') {
            return { name: item.trim() };
          }
          if (item && typeof item === 'object' && item.name) {
            return { name: item.name.trim() };
          }
          return null;
        })
        .filter((item): item is CreateIngredientDto => item !== null);

      if (ingredients.length === 0) {
        throw new Error('No valid ingredients found after processing.');
      }

      this.logger.log(
        `✅ Successfully parsed ${ingredients.length} ingredients.`,
      );
      return ingredients;
    } catch (e) {
      this.logger.error(`❌ Error parsing ingredients: ${e.message}`);
      this.logger.error(
        `Raw ingredients value: ${JSON.stringify(body.ingredients)}`,
      );
      throw new BadRequestException(`Invalid ingredients format: ${e.message}`);
    }
  }

  private parseSteps(body: any, files: any): CreateStepDto[] {
    this.logger.debug('=== PARSING STEPS ===');
    const steps: CreateStepDto[] = [];

    let stepIndex = 0;
    while (body[`steps[${stepIndex}][description]`] != null) {
      const description = body[`steps[${stepIndex}][description]`];

      if (!description || description.trim() === '') {
        this.logger.error(
          `❌ Validation failed: Step ${stepIndex + 1} description is empty.`,
        );
        throw new BadRequestException(
          `Step ${stepIndex + 1} description is required.`,
        );
      }

      const order = parseInt(
        body[`steps[${stepIndex}][order]`] || (stepIndex + 1).toString(),
        10,
      );
      const stepImageKey = `steps[${stepIndex}][image]`;
      const stepImage = files[stepImageKey]?.[0];

      steps.push({
        stepNumber: order,
        description: description.trim(),
        image: stepImage?.filename || undefined,
      });

      this.logger.debug(
        `✅ Parsed step ${stepIndex + 1}: "${description.substring(0, 50)}..." (image: ${stepImage ? 'Yes' : 'No'})`,
      );
      stepIndex++;
    }

    if (steps.length === 0 && body.steps) {
      this.logger.debug(
        'No individual step fields found, trying to parse `steps` object/array.',
      );
      try {
        let parsedSteps: any;

        if (typeof body.steps === 'string') {
          parsedSteps = JSON.parse(body.steps);
          this.logger.debug('Steps parsed from JSON string.');
        } else if (Array.isArray(body.steps)) {
          parsedSteps = body.steps;
          this.logger.debug('Steps already an array.');
        } else {
          throw new Error('Invalid steps format in request body.');
        }

        if (!Array.isArray(parsedSteps)) {
          throw new Error('Steps data is not an array.');
        }

        parsedSteps.forEach((step, index) => {
          if (
            !step ||
            !step.description ||
            typeof step.description !== 'string' ||
            step.description.trim() === ''
          ) {
            throw new Error(
              `Step ${index + 1} description is required and must be a string.`,
            );
          }

          const stepImageKey = `steps[${index}][image]`;
          const stepImage = files[stepImageKey]?.[0];

          steps.push({
            stepNumber: parseInt(
              step.order || step.stepNumber || (index + 1).toString(),
              10,
            ),
            description: step.description.trim(),
            image: stepImage?.filename || step.image || undefined,
          });

          this.logger.debug(
            `✅ Parsed step ${index + 1}: "${step.description.substring(0, 50)}..." (image: ${stepImage ? 'Yes' : 'No'})`,
          );
        });

        this.logger.log(
          `✅ Successfully parsed ${steps.length} steps from object/array.`,
        );
      } catch (e) {
        this.logger.error(`❌ Error parsing steps: ${e.message}`);
        this.logger.error(`Raw steps value type: ${typeof body.steps}`);
        if (body.steps && typeof body.steps === 'object') {
          this.logger.error(`Raw steps keys: ${Object.keys(body.steps)}`);
        } else {
          this.logger.error(`Raw steps value: ${body.steps}`);
        }
        throw new BadRequestException(`Invalid steps format: ${e.message}`);
      }
    }

    if (steps.length === 0) {
      this.logger.error(
        '❌ Validation failed: No steps provided in the request.',
      );
      throw new BadRequestException('At least one step is required.');
    }

    steps.sort((a, b) => a.stepNumber - b.stepNumber);
    this.logger.log(`✅ Total parsed and sorted steps: ${steps.length}`);
    return steps;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'steps[0][image]', maxCount: 1 },
      { name: 'steps[1][image]', maxCount: 1 },
      { name: 'steps[2][image]', maxCount: 1 },
      { name: 'steps[3][image]', maxCount: 1 },
      { name: 'steps[4][image]', maxCount: 1 },
      { name: 'steps[5][image]', maxCount: 1 },
      { name: 'steps[6][image]', maxCount: 1 },
      { name: 'steps[7][image]', maxCount: 1 },
      { name: 'steps[8][image]', maxCount: 1 },
      { name: 'steps[9][image]', maxCount: 1 },
      { name: 'steps[10][image]', maxCount: 1 },
      { name: 'steps[11][image]', maxCount: 1 },
      { name: 'steps[12][image]', maxCount: 1 },
      { name: 'steps[13][image]', maxCount: 1 },
      { name: 'steps[14][image]', maxCount: 1 },
      { name: 'steps[15][image]', maxCount: 1 },
      { name: 'steps[16][image]', maxCount: 1 },
      { name: 'steps[17][image]', maxCount: 1 },
      { name: 'steps[18][image]', maxCount: 1 },
      { name: 'steps[19][image]', maxCount: 1 },
    ]),
  )
  async create(
    @Request() req,
    @UploadedFiles()
    files: {
      mainImage?: MulterFile[];
      [key: string]: MulterFile[] | undefined;
    },
  ) {
    const userId = req.user.id;
    const body = req.body;

    this.logger.log('=== CREATE RECIPE REQUEST ===');
    this.logger.log(`User ID: ${userId}`);
    this.logger.log(`Body fields: ${Object.keys(body).join(', ')}`);
    this.logger.log(`Uploaded files: ${Object.keys(files).join(', ')}`);
    this.logger.log(`isPublic value: "${body.isPublic}" (type: ${typeof body.isPublic})`);

    if (!body.title || body.title.trim() === '') {
      throw new BadRequestException('Title is required');
    }
    if (!body.category || body.category.trim() === '') {
      throw new BadRequestException('Category is required');
    }
    if (!body.difficulty || body.difficulty.trim() === '') {
      throw new BadRequestException('Difficulty is required');
    }
    if (!files.mainImage || files.mainImage.length === 0) {
      throw new BadRequestException('Main image is required');
    }

    const ingredients = this.parseIngredients(body);
    const steps = this.parseSteps(body, files);

    const servings = parseInt(body.servings, 10);
    if (isNaN(servings) || servings < 1) {
      throw new BadRequestException(
        'Servings must be a valid number and at least 1',
      );
    }
    const prepTime = parseInt(body.prepTime, 10);
    if (isNaN(prepTime) || prepTime < 0) {
      throw new BadRequestException(
        'Prep time must be a valid number and at least 0',
      );
    }
    const cookTime = parseInt(body.cookTime, 10);
    if (isNaN(cookTime) || cookTime < 0) {
      throw new BadRequestException(
        'Cook time must be a valid number and at least 0',
      );
    }

    // Parse isPublic dengan default true
    let isPublic = true;
    if (body.isPublic !== undefined) {
      if (typeof body.isPublic === 'string') {
        isPublic = body.isPublic.toLowerCase() === 'true';
      } else if (typeof body.isPublic === 'boolean') {
        isPublic = body.isPublic;
      }
    }

    const createRecipeDto: CreateRecipeDto = {
      title: body.title.trim(),
      description: body.description?.trim() || '',
      category: body.category.trim(),
      difficulty: body.difficulty.trim(),
      servings: servings,
      prepTime: prepTime,
      cookTime: cookTime,
      mainImage: files.mainImage[0].filename,
      ingredients: ingredients,
      steps: steps,
      isPublic: isPublic,
    };

    this.logger.log('=== PROCESSED DTO ===');
    this.logger.debug(JSON.stringify(createRecipeDto, null, 2));

    try {
      const result = await this.recipesService.create(userId, createRecipeDto);
      this.logger.log(`✅ Recipe created successfully with ID: ${result.id}`);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Recipe created successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`❌ Error creating recipe: ${error.message}`);
      throw new BadRequestException(
        'Failed to create recipe: ' + error.message,
      );
    }
  }

  @Get()
  @Public()
  findAll(
    @Request() req,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id;
    const options = {
      category: category,
      search: search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };

    this.logger.log(
      `📋 Finding recipes - User: ${userId || 'guest'}, Category: ${category || 'all'}, Search: ${search || 'none'}`,
    );
    
    return this.recipesService.findAll(userId, options);
  }

  @Get(':id')
  @Public()
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user?.id;
    this.logger.log(`🔍 Finding recipe ${id} - User: ${userId || 'guest'}`);
    return this.recipesService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    const userId = req.user.id;
    this.logger.log(`✏️ Updating recipe ${id} - User: ${userId}`);
    return this.recipesService.update(id, userId, updateRecipeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    this.logger.log(`🗑️ Deleting recipe ${id} - User: ${userId}`);
    return this.recipesService.remove(id, userId);
  }
}