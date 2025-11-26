import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleSignInDto } from './dto/google-android.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Inisialisasi OAuth2Client dengan Web Client ID (opsional, tapi umum digunakan)
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_WEB_CLIENT_ID'),
    );
  }

  // ==================== REGISTER ====================
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone, avatar } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        avatar,
      },
      select: this.getUserSelectFields(),
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  // ==================== LOGIN ====================
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const userWithoutPassword = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      notificationsEnabled: user.notificationsEnabled,
      darkModeEnabled: user.darkModeEnabled,
      autoPlayVideos: user.autoPlayVideos,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  // ==================== GOOGLE FLUTTER LOGIN (ANDROID/IOS) ====================
  async googleFlutterLogin(googleSignInDto: GoogleSignInDto) {
    const { email, name, avatar, idToken } = googleSignInDto;

    // === DEBUG LOGGING START ===
    const webClientId = this.configService.get('GOOGLE_WEB_CLIENT_ID');
    const androidClientId = this.configService.get('GOOGLE_ANDROID_CLIENT_ID');
    console.log('🔍 DEBUG ENV VALUES:');
    console.log('GOOGLE_WEB_CLIENT_ID:', webClientId);
    console.log('GOOGLE_ANDROID_CLIENT_ID:', androidClientId);

    const audience = [webClientId, androidClientId].filter(Boolean);
    console.log('🎯 Final audience used for verification:', audience);

    // Opsional: decode token sementara untuk cek `aud`
    const decodedHeader = JSON.parse(
      Buffer.from(idToken.split('.')[0], 'base64url').toString(),
    );
    const decodedPayload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64url').toString(),
    );
    console.log('📥 Incoming token "aud":', decodedPayload.aud);
    console.log('📧 Incoming token "email":', decodedPayload.email);
    // === DEBUG LOGGING END ===

    try {
      // ✅ Verifikasi token dengan **multiple audience**
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: [
          this.configService.get('GOOGLE_WEB_CLIENT_ID'),
          this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
          // Tambahkan iOS jika perlu:
          // this.configService.get('GOOGLE_IOS_CLIENT_ID'),
        ].filter(Boolean), // Hapus undefined/null
      });

      const payload = ticket.getPayload();

      // Validasi payload wajib
      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      // Pastikan email cocok antara token dan DTO
      if (payload.email !== email) {
        throw new UnauthorizedException('Email mismatch in Google token');
      }

      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.log('Creating new user from Google Sign-In:', email);
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            avatar: avatar || null,
            googleId: payload.sub,
            password: await bcrypt.hash(
              Math.random().toString(36) + Date.now().toString(36),
              12,
            ),
          },
        });
      } else if (!user.googleId) {
        console.log('Linking Google account to existing user:', email);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: payload.sub,
            avatar: user.avatar || avatar || null,
            name: name || user.name,
          },
        });
      } else {
        console.log('Updating existing Google user:', email);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            avatar: avatar || user.avatar,
            name: name || user.name,
          },
        });
      }

      const tokens = await this.generateTokens(user.id, user.email);

      const userResponse = {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        notificationsEnabled: user.notificationsEnabled,
        darkModeEnabled: user.darkModeEnabled,
        autoPlayVideos: user.autoPlayVideos,
        language: user.language,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        user: userResponse,
        ...tokens,
      };
    } catch (error) {
      console.error('Google Flutter login failed:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (
        error.message?.includes?.('Wrong recipient') ||
        error.message?.includes?.('audience')
      ) {
        throw new UnauthorizedException(
          'Google token audience mismatch. Invalid client.',
        );
      }

      throw new UnauthorizedException('Google authentication failed');
    }
  }

  // ==================== LEGACY: GOOGLE ANDROID LOGIN (Jika Masih Dipakai) ====================
  async googleAndroidLogin(idToken: string) {
    const googleUser = await this.verifyGoogleToken(idToken);
    return this.googleLogin(googleUser);
  }

  // ==================== GOOGLE LOGIN (WEB/LEGACY) ====================
  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar || null,
          googleId: googleUser.googleId,
          password: await bcrypt.hash(
            Math.random().toString(36) + Date.now().toString(36),
            12,
          ),
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          avatar: user.avatar || googleUser.avatar || null,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const userResponse = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      notificationsEnabled: user.notificationsEnabled,
      darkModeEnabled: user.darkModeEnabled,
      autoPlayVideos: user.autoPlayVideos,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userResponse,
      ...tokens,
    };
  }

  // ==================== VERIFY GOOGLE TOKEN (FOR LEGACY) ====================
  private async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: [
          this.configService.get('GOOGLE_WEB_CLIENT_ID'),
          this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
        ].filter(Boolean),
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || 'Google User',
        avatar: payload.picture || undefined,
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired Google token');
    }
  }

  // ==================== REFRESH TOKEN ====================
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret-key',
      });

      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(payload.sub, payload.email);

      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ==================== LOGOUT ====================
  async logout(userId: number, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId },
      });
    }

    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    return { message: 'Logged out successfully' };
  }

  // ==================== VALIDATE USER ====================
  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: this.getUserSelectFields(),
    });
  }

  // ==================== CHANGE PASSWORD ====================
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.googleId && !user.password) {
      throw new BadRequestException(
        'Cannot change password for Google SSO accounts. Please use Google to sign in.',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // ==================== PRIVATE HELPERS ====================
  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret-key',
      expiresIn: '7d',
    });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private getUserSelectFields() {
    return {
      id: true,
      uuid: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      notificationsEnabled: true,
      darkModeEnabled: true,
      autoPlayVideos: true,
      language: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
