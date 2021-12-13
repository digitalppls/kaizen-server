import {
    IsEmail,
    IsLowercase,
    IsNotEmpty,
    IsNotIn,
    IsNumber,
    IsString,
    Matches,
    MaxLength,
    MinLength
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import { IsMatch } from "../../decorators/is-match.decorator";


export class CheckLoginDto{

    @ApiProperty({type: String, required: true, description: "login"})
    @IsString()
    @IsNotEmpty()
    @IsLowercase()
    @IsNotIn(["admin","support","help","promo","owner"])
    @MinLength(4)
    @MaxLength(10)
    @Matches("^[A-Za-z0-9]+$")
    readonly login: string;
}
