import {IsInt, IsPositive, Max, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";


export class ListUserDto {
    @IsInt()
    @Min(0)
    @ApiPropertyOptional({type:Number, description:"отступ выборки"})
    offset:number;

    @IsPositive()
    @IsInt()
    @Min(1)
    @Max(1000)
    @ApiPropertyOptional({type:Number, default:10, description:"Лимит выборки"})
    limit:number;
}
