import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Document, Types } from "mongoose";
import { CurrencyService } from "../currency/currency.service";
import {Symbol} from "src/currency/currency.schema";

@Schema()
export class Wallet {
  @ApiProperty({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @ApiProperty({ type: Number, description: "chat id" })
  @Prop({ index: true, required: true, type: Number })
  chat_id: number;

  @ApiProperty({ type: Types.ObjectId })
  @Prop({ index: true, required: true, type: Types.ObjectId })
  userId:Types.ObjectId;

  @ApiProperty({ type: String, enum:Symbol, description: "Cryptocurrency symbol, ex: eth, btc, trx..." })
  @Prop({ index: true, required: true, type: String, enum:Symbol })
  symbol: Symbol;

  @ApiProperty({ type: Number, description: "amount" })
  @Prop({ index: true, required: true, type: Number })
  amount: number;


  amountUsd: number;
}

export type WalletDocument = Wallet & Document;
export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj['_id'];
  delete obj['__v'];
  obj["amountUsd"]=CurrencyService.toUsd(obj['symbol'],obj['amount']);
  return obj;
};
