import {
    IsEmail,
    IsLowercase,
    IsNotEmpty,
    IsNumber, IsPositive,
    IsString,
    Matches,
    Max,
    MaxLength,
    MinLength
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class WithdrawWalletDto {


    @ApiProperty({type: String, required: true, description: "тип криптовалюты, которую нужно вывести. Например erc20usdt, bep20btc, trc20usdt, trx, eth, bnb ..."})
    @IsLowercase()
    @IsString()
    readonly coinType: string;

    @ApiProperty({type: String, required: true, description: "Адрес кошелька, на который нужно отправить "})
    @IsString()
    readonly toAddress: string;

    @IsPositive()
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({type: Number, required: true, description: "Количество, которое необходимо вывести"})
    readonly amount: number;
}
