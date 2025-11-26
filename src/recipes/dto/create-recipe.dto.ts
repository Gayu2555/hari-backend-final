import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateStepDto {
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty({ message: 'title should not be empty, title must be a string' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsInt()
  @Min(1)
  servings: number;

  @IsInt()
  @Min(0)
  prepTime: number;

  @IsInt()
  @Min(0)
  cookTime: number;

  @IsString()
  @IsNotEmpty()
  mainImage: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps: CreateStepDto[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
