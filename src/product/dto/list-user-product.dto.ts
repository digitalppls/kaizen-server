
import {IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";



export class ListUserProductDto{
    @IsInt()
    @Min(0)
    @ApiPropertyOptional({type:Number, description:"отступ выборки"})
    offset:number;

    @IsPositive()
    @IsInt()
    @ApiPropertyOptional({type:Number, description:"Лимит выборки"})
    limit:number;

}
