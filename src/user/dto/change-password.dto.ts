import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional, ApiResponse } from "@nestjs/swagger";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_PATTERN } from "./create-user.dto";

export class ChangePasswordDto {

  @ApiProperty({ type: String, required: true, description: "Старый пароль" })
  @IsString()
  @IsNotEmpty()
  readonly oldPassword: string;

  @ApiProperty({ type: String, required: true, description: "Новый пароль" })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN)
  readonly newPassword: string;
}
