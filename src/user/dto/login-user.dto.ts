import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, MinLength } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class LoginUserDto {
    @ApiProperty({type: String, required: true, description: "Почтовый ящик"})
    @IsEmail()
    @MaxLength(50)
    readonly email: string;

    @ApiProperty({type: String, required: true, description: "Пароль"})
    @IsNotEmpty()
    @MaxLength(50)
    readonly password: string;

}
