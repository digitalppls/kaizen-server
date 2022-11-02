import {OperationType} from "../operation.schema";
import {IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";



export class StatOperationDto{
    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiPropertyOptional({type:Number, description:"отступ выборки"})
    offset?:number=0;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @ApiPropertyOptional({type:Number, description:"Лимит выборки"})
    limit:number=10;

    @IsOptional()
    @IsEnum(OperationType)
    @ApiPropertyOptional({type:String,enum:OperationType, description:"Тип операции (если не указан то все)"})
    type?:OperationType;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @ApiPropertyOptional({type:Number, description:"Группировка по времени", default:86400000})
    groupBy?:number=86400000; // 1 day for default


}
