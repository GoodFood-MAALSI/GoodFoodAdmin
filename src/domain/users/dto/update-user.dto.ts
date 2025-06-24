import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "Antoine" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  first_name?: string | null;

  @ApiPropertyOptional({ example: "Dupont" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  last_name?: string | null;
}