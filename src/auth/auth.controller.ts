// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleSignInDto } from './dto/google-android.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from '../users/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ===== GOOGLE SSO ENDPOINTS =====

  /**
   * Google OAuth for Web - Initiate
   * GET /auth/google
   * Redirects to Google login page
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  /**
   * Google OAuth for Web - Callback
   * GET /auth/google/callback
   * Google redirects here after successful login
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req) {
    return this.authService.googleLogin(req.user);
  }

  /**
   * Google Sign-In for Flutter/Android
   * POST /auth/google-signin
   * Receives complete user data from Google Sign-In
   */
  @Public()
  @Post('google-signin')
  @HttpCode(HttpStatus.OK)
  async googleSignIn(@Body() googleSignInDto: GoogleSignInDto) {
    const result = await this.authService.googleFlutterLogin(googleSignInDto);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  }

  // ===== END GOOGLE SSO ENDPOINTS =====

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Body('refreshToken') refreshToken?: string,
  ) {
    return this.authService.logout(user.sub, refreshToken);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.validateUser(user.sub);
  }

  @Public()
  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmailAvailability(@Body('email') email: string) {
    const user = await this.authService['prisma'].user.findUnique({
      where: { email },
    });

    return {
      available: !user,
      message: user ? 'Email already taken' : 'Email available',
    };
  }
}
