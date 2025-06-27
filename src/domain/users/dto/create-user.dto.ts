import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { lowerCaseTransformer } from 'src/domain/utils/transformers/lower-case.transformer';
import { UserRole, UserStatus } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty({ example: 'Passw@rd1' })
  @Matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W).*$/, {
    message: 'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial.',
  })  
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'Antoine' })
  @IsNotEmpty()
  first_name: string | null;

  @ApiProperty({ example: 'Dupont' })
  @IsNotEmpty()
  last_name: string | null;

  status?: UserStatus;

  hash?: string | null;

  role?: UserRole;
}
