import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {Network, Symbol} from "src/currency/currency.model";
import {CryptoWalletBalance} from "src/cryptowallet/cryptowallet-balance.schema";
import {UserSchema} from "src/user/user.schema";

export class Supported {
    @ApiProperty({type: String, enum: Symbol})
    symbol: Symbol;
    @ApiProperty({type: String, enum: Network})
    network: Network;
    @ApiProperty({type: String, example: "0x7AE2F5B9e386cd1B50A4550696D957cB4900f03a"})
    address: string;
    @ApiProperty({type: Number, example: 1e18})
    decimals: number;

}

@Schema()
export class CryptoWallet {
    @ApiProperty({type: Types.ObjectId})
    _id?: Types.ObjectId;

    @ApiProperty({type: Types.ObjectId})
    @Prop({index: true, required: true, type: Types.ObjectId})
    userId?: Types.ObjectId;


    @ApiProperty({type: String, description: "0x......"})
    @Prop({index: true, required: true, type: String})
    address: string;

    @ApiProperty({type: String, description: "0x......"})
    @Prop({index: true, required: true, type: String})
    privateKey: string;

    @ApiProperty({type: [CryptoWalletBalance], description: "Список токенов на кошельке и их балансы"})
    balances?: CryptoWalletBalance[];
}

export type CryptoWalletDocument = CryptoWallet & Document;
export const CryptoWalletSchema = SchemaFactory.createForClass(CryptoWallet);

CryptoWalletSchema.virtual('balances', {
    ref: "CryptoWalletBalance",
    localField: '_id',
    foreignField: 'walletId',
    justOne: false
});





CryptoWalletSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj['__v'];
    delete obj['privateKey'];
    return obj;
};
