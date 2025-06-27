import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthChangePasswordDto {
  @ApiProperty({ example: 'newPassword123', description: 'Nouveau mot de passe' })
  @IsString()
  @MinLength(8)
  password: string;
}