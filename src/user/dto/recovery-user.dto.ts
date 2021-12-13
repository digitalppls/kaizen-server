import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, MinLength } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class RecoveryUserDto {
    @ApiProperty({type: String, required: true, description: "Почтовый ящик"})
    @IsEmail()
    @MaxLength(50)
    readonly email: string;
}
