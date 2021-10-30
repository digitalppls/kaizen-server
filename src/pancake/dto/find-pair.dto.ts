import {IsEnum, IsEthereumAddress, isEthereumAddress, IsInt, IsOptional, IsPositive, Max, Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {Network} from "src/currency/currency.model";


export class FindPairDto {
    @IsEthereumAddress()
    @ApiPropertyOptional({type: String, description: "Первый адрес токена из пары", example:"0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"})
    token0Address: string;

    @IsEthereumAddress()
    @ApiPropertyOptional({type: String, description: "Второй адрес токена из пары, по умолчанию это Адрес Wraped BNB", default:'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', example:'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'})
    token1Address: string;
}
