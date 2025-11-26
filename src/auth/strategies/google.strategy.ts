// src/auth/strategies/google.strategy.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientId = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackUrl = configService.get('GOOGLE_CALLBACK_URL');

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error(`
        Google OAuth config missing! Check your .env file:
        GOOGLE_CLIENT_ID = ${clientId}
        GOOGLE_CLIENT_SECRET = ${clientSecret ? 'BENAR' : 'SALAH'}
        GOOGLE_CALLBACK_URL = ${callbackUrl}
      `);
    }

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, name, emails, photos } = profile;
    return {
      googleId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      avatar: photos[0]?.value || null,
      accessToken,
    };
  }
}
