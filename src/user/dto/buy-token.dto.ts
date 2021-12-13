import {IsNumber, IsPositive, IsString,} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {Symbol} from "src/currency/currency.schema";


export class BuyTokenDto {

    @ApiProperty({type: String, required: true, description: "Валюта, за которую покупать"})
    @IsString()
    readonly fromSymbol: Symbol;


    @ApiProperty({type: Number, required: true, description: "Количество токенов"})
    @IsNumber()
    @IsPositive()
    readonly toAmount: number;

}
