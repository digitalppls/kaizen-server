import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, MinLength } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import { TransactionInterface } from "./transaction.interface";


export class CallbackWalletDto {
    readonly transaction: TransactionInterface;
    readonly secret: string

}
