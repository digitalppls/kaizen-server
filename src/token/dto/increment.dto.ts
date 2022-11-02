import {IsEnum, IsMongoId, IsNumber, IsPositive, IsString,} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {Symbol} from "src/currency/currency.schema";
import {Types} from "mongoose";


export class IncrementDto {

    @ApiProperty({type: String, required: true, description: "Валюта"})
    @IsString()
    @IsEnum(Symbol)
    readonly symbol: Symbol;

    @ApiProperty({type: String, required: true, description: "Валюта, за которую покупать"})
    @IsMongoId()
    readonly userId: Types.ObjectId;


    @ApiProperty({type: Number, required: true, description: "Сумма"})
    @IsNumber()
    readonly amount: number;

}
