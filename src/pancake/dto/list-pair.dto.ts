import {IsEnum, IsInt, IsOptional, IsPositive, Max, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {Network} from "src/currency/currency.model";


export class ListPairDto {
    @IsInt()
    @Min(0)
    @ApiPropertyOptional({type: Number, description: "отступ выборки"})
    offset: number;

    @IsPositive()
    @IsInt()
    @Max(100)
    @ApiPropertyOptional({type: Number, default:10, description: "Лимит выборки"})
    limit: number;

    @IsOptional()
    @IsEnum(Network)
    @ApiPropertyOptional({type: String, enum: Network, default:Network.BEP20, description: "Сеть"})
    network?: Network;
}
