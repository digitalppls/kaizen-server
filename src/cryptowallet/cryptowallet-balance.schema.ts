import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {Network, Symbol} from "src/currency/currency.model";
import {Document, Types} from "mongoose";
import {CurrencyService} from "src/currency/currency.service";

@Schema()
export class CryptoWalletBalance {

    @ApiProperty({ type: Types.ObjectId, description: "_id of CryptoWallet" })
    @Prop({ index: true, required: true, type: Types.ObjectId })
    walletId: Types.ObjectId;

    @ApiProperty({ type: String, enum:Symbol, description: "Cryptocurrency symbol, ex: eth, btc, trx..." })
    @Prop({ index: true, required: true, type: String, enum:Symbol })
    symbol: Symbol;

    @ApiProperty({ type: String, enum:Network, description: "Cryptocurrency network " })
    @Prop({ index: true, required: true, type: String, enum:Network })
    network: Network;

    @ApiProperty({ type: Number, description: "amount" })
    @Prop({ index: true, required: true, type: Number })
    amount: number;

    @ApiProperty()
    _id?:Types.ObjectId;

    @ApiProperty({ type: Number, description: "Сумма в $ по последнему курсу" })
    amountUsd?: number;
}
export const CryptoWalletBalanceSchema = SchemaFactory.createForClass(CryptoWalletBalance);

export type CryptoWalletBalanceDocument = CryptoWalletBalance & Document;



CryptoWalletBalanceSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj['__v'];
    obj["amountUsd"]=CurrencyService.toUsd(obj['symbol'],obj['amount']);
    return obj;
};
