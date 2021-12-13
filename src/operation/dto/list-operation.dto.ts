import {OperationType} from "../operation.schema";
import {IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";



export class ListOperationDto{
    @IsInt()
    @Min(0)
    @ApiPropertyOptional({type:Number, description:"отступ выборки"})
    offset:number;

    @IsPositive()
    @IsInt()
    @ApiPropertyOptional({type:Number, description:"Лимит выборки"})
    limit:number;

    @IsOptional()
    @IsEnum(OperationType)
    @ApiPropertyOptional({type:String,enum:OperationType, description:"Тип операции (если не указан то все)"})
    type?:OperationType;
}
