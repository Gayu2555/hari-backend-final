// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateSettingsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('email') email?: string, @Request() req?) {
    // If email query param exists, search by email
    if (email) {
      return this.usersService.findByEmail(email, req.user.id);
    }
    // Otherwise return all users
    return this.usersService.findAll();
  }

  // ⚠️ IMPORTANT: Specific routes MUST come BEFORE dynamic :id routes
  // Put all /users/:id/something routes here, before GET /users/:id

  @Get(':id/favorites')
  getUserFavorites(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.usersService.getUserFavorites(id, user.id);
  }

  @Get(':id/reviews')
  getUserReviews(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.usersService.getUserReviews(id, user.id);
  }

  @Get(':id/recipes')
  getUserRecipes(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.usersService.getUserRecipes(id, user.id);
  }

  @Get(':id/dashboard')
  getDashboardStats(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.usersService.getDashboardStats(id, user.id);
  }

  // Now the generic :id route comes AFTER all specific routes
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateProfile(id, updateUserDto, user.id);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSettingsDto: UpdateSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateSettings(id, updateSettingsDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.id);
  }
}
