import {IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";


export class HistoryCurrencyDto {
    @IsPositive()
    @IsInt()
    @ApiPropertyOptional({type: Number, description: "С какой даты"})
    fromTimestamp: number;

    @IsPositive()
    @IsInt()
    @ApiPropertyOptional({type: Number, description: "По какую дату"})
    toTimestamp: number;

    @IsOptional()
    @ApiPropertyOptional({type: String, description: "Символ пары, например BTCUSDT"})
    symbol?: string;
}
