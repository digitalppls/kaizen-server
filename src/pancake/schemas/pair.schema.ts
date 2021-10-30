import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {Network} from "src/currency/currency.model";
import {Token} from "src/pancake/schemas/token.schema";

@Schema({autoIndex: true, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class Pair {

    @ApiProperty({type: String, description: "Адрес токена 0"})
    @Prop({index: true, required: false, type: String})
    token0Address: string;

    @ApiProperty({type: String, description: "Адрес токена 1"})
    @Prop({index: true, required: false, type: String})
    token1Address: string;

    @ApiProperty({type: String, description: "Адрес пары"})
    @Prop({index: true, unique: true, required: false, type: String})
    address: string;

    @ApiProperty({type: String, enum: Network, description: "Сеть"})
    @Prop({index: true, required: false, type: String, enum: Network})
    network: Network;


    @ApiProperty({type: Token, description: "Токен0"})
    token0?:Token;

    @ApiProperty({type: Token, description: "Токен1"})
    token1?:Token;

    @ApiProperty()
    _id?: Types.ObjectId;


}

export type PairDocument = Pair & Document;
export const PairSchema = SchemaFactory.createForClass(Pair);

PairSchema.virtual('token0', {ref: 'Token', localField: 'token0Address', foreignField: 'address', justOne: true});
PairSchema.virtual('token1', {ref: 'Token', localField: 'token1Address', foreignField: 'address', justOne: true});
