import {IsEnum, IsNumber, IsPositive, IsString,} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {Symbol} from "src/currency/currency.schema";


export class SwapTokenDto {

    @ApiProperty({type: String, required: true, description: "Символ токена или индекса", enum:Symbol})
    @IsEnum(Symbol)
    readonly fromSymbol: Symbol;

    @ApiProperty({type: String, required: true, description: "Символ токена или индекса", enum:Symbol})
    @IsEnum(Symbol)
    readonly toSymbol: Symbol;

    @ApiProperty({type: Number, required: true, description: "Количество готов заплатить"})
    @IsNumber()
    @IsPositive()
    readonly fromAmount: number;

}
