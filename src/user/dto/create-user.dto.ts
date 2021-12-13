import {
    IsEmail,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength
} from "class-validator";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";


export const PASSWORD_PATTERN = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 50;

export class CreateUserDto{

    @ApiProperty({type: String, required: true, description: "Почтовый ящик"})
    @IsEmail()
    @MaxLength(EMAIL_MAX_LENGTH)
    readonly email: string;

    @ApiProperty({type: String, required: true, description: "Пароль"})
    @IsString()
    @IsNotEmpty()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    @Matches(PASSWORD_PATTERN, {message: 'Password too weak'})
    readonly password: string;

    @IsOptional()
    @IsNumber()
    readonly chat_id?:number;

    @ApiProperty({type: String, required: true, description: "Никнейм"})
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    readonly username?:string;

    @ApiPropertyOptional({type: String, required: false, description: "реферальный код"})
    @IsOptional()
    @IsMongoId()
    readonly ref?:string;

    @ApiPropertyOptional({type: String, required: false, description: "Имя"})
    @IsOptional()
    @IsString()
    readonly first_name?:string;

    @ApiPropertyOptional({type: String, required: false, description: "Фамилия"})
    @IsOptional()
    @IsString()
    readonly last_name?:string;

    @ApiPropertyOptional({type: String, required: false, description: "Код языка"})
    @IsOptional()
    @IsString()
    readonly language_code?:string;
}
