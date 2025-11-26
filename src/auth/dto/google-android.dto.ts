// src/auth/dto/google-android.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class GoogleSignInDto {
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString({ message: 'Nama harus berupa string' })
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsNotEmpty({ message: 'ID Token tidak boleh kosong' })
  @IsString({ message: 'ID Token harus berupa string' })
  idToken: string;

  @IsNotEmpty({ message: 'Access Token tidak boleh kosong' })
  @IsString({ message: 'Access Token harus berupa string' })
  accessToken: string;
}
