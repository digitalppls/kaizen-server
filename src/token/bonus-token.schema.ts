import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional, IsPositive} from "class-validator";
import {Symbol} from "src/currency/currency.schema";


@Schema({autoIndex: true, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class BonusToken {

    @ApiPropertyOptional({type: String, description: "_id"})
    @IsMongoId()
    @IsOptional()
    _id: Types.ObjectId;

    @ApiPropertyOptional({type: Number, description: "Номер линии"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsPositive()
    @IsOptional()
    line: number;

    @ApiProperty({type: String, required: true, description: "Символ токена или индекса, за покупку которого будет бонус", enum:Symbol})
    @Prop({index: true, required: true, type: String, enum:Symbol})
    @IsOptional()
    @IsEnum(Symbol)
    readonly toSymbol: Symbol;

    @ApiProperty({type: Boolean, required: true, description: "Начислять бонус в той валюте, которую купили (а не потратили)"})
    @Prop({index: true, required: true, type: Boolean})
    @IsOptional()
    @IsBoolean()
    readonly bonusAsGetSymbol?: boolean = false;

    @ApiPropertyOptional({type: Number, description: "Процент от суммы для вознаграждения"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    percent: number;

}

export type BonusTokenDocument = BonusToken & Document;
export const BonusTokenSchema = SchemaFactory.createForClass(BonusToken);


BonusTokenSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj["__v"];
    return obj;
};
