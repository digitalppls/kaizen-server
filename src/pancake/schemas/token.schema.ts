import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {Network} from "src/currency/currency.model";
import {UserSchema} from "src/user/user.schema";

@Schema()
export class Token {

    @ApiProperty({type: Number, description: "Разрядность"})
    @Prop({index: true, required: false, type: Number})
    decimals: number;

    @ApiPropertyOptional({type: Number, description: "Резерв в пуле"})
    @Prop({index: true, required: false, type: Number})
    reserve?: number;

    @ApiProperty({type: String, enum: Network, description: "Сеть"})
    @Prop({index: true, required: false, type: String, enum: Network})
    network: Network;

    @ApiProperty({type: String, description: "Адрес"})
    @Prop({index: true, unique:true, required: false, type: String})
    address: string;

    @ApiProperty({type: String, description: "Символ"})
    @Prop({index: true, required: false, type: String})
    symbol: string;

    @ApiProperty({type: String, description: "Название"})
    @Prop({index: true, required: false, type: String})
    name: string;

    @ApiProperty()
    _id?: Types.ObjectId;


}



export type TokenDocument = Token & Document;
export const TokenSchema = SchemaFactory.createForClass(Token);

