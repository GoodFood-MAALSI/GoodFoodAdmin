import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'john.doe@example.com', description: "L'email de l'utilisateur" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', description: "Le prénom de l'utilisateur" })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe', description: "Le nom de l'utilisateur" })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  role?: UserRole;
}