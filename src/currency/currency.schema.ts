import {ApiProperty} from "@nestjs/swagger";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Types} from "mongoose";
import {CurrencyService} from "src/currency/currency.service";

export enum Symbol {
    USDT = "usdt",
    BUSD = "busd",
    USDC = "usdc",
    BTC = "btc",
    TRX = "trx",
    ETH = "eth",
    BNB = "bnb",
    VNG = "vng",
    SRK = "srk",
    KZN = "kzn",
}

export enum Index {
    DEFI = "defi",
    CRYPTO10 = "coin10",
    BITW = "kaizen",
    CIX100 = "crypto100",
}

export enum Network {
    ERC20 = "erc20",
    TRC20 = "trc20",
    BEP20 = "bep20",
}


@Schema()
export class Currency {
    @ApiProperty({type: String, example: "ETHUSDT"})
    @Prop({index: true, required: true, type: String})
    readonly symbol: string;

    @ApiProperty({type: Number, example: 4500})
    @Prop({index: true, required: true, type: Number})
    price: number;

    @ApiProperty({type: Boolean, default: false, example:false, description: "Это индекс?"})
    @Prop({index: true, required: false, type: Boolean, default:false})
    index?: boolean = false;

    @ApiProperty({type: Date,  example: new Date(), description: "Дата обновления"})
    @Prop({default: Date.now, required: false})
    date: Date;

}


export type CurrencyDocument = Currency & Document;
export const CurrencySchema = SchemaFactory.createForClass(Currency);




CurrencySchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj["__v"];
    delete obj["_id"];
    obj["timestamp"]=new Date(obj['date']).getTime()
    return obj;
};
