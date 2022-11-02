import {OperationType} from "../operation.schema";
import {IsEnum, IsInt, IsMongoId, IsNumber, IsOptional, IsPositive, Min} from "class-validator";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Symbol} from "src/currency/currency.schema";


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

    @IsOptional()
    @IsEnum(Symbol)
    @ApiPropertyOptional({type:String,enum:Symbol, description:"Валюта"})
    symbol?:Symbol;

    @ApiPropertyOptional({type: String, description: "_id пользователя (Необязательный параметр)"})
    @IsOptional()
    @IsMongoId({})
    userId?: string;
}
