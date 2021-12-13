import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, MinLength } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {LoginUserDto} from "src/user/dto/login-user.dto";


export class PasswordSetDto extends LoginUserDto{


    @ApiProperty({type: String, required: true, description: "Временный код"})
    @IsString()
    @IsNotEmpty()
    readonly code: string;
}
