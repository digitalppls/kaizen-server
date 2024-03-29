import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional, IsPositive, IsString, Min} from "class-validator";
import {Symbol} from "src/currency/currency.schema";

export enum SaleType {
    PRE_SALE="pre_sale",
    IDO="IDO",
    PUBLIC_SALE="public_sale",
    REWARD_FUND="reward_fund",
    OWNER_FUND="owner_fund"
}


@Schema({autoIndex: true, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class SaleToken {

    @ApiPropertyOptional({type: String, description: "_id"})
    @IsMongoId()
    @IsOptional()
    _id: Types.ObjectId;

    @ApiPropertyOptional({type: Number, description: "Раунд"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @Min(0)
    @IsOptional()
    round: number;

    @ApiPropertyOptional({type: Number, description: "Объем раунда"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @Min(0)
    @IsOptional()
    value: number;

    @ApiPropertyOptional({type: Number, description: "Максимальный объем раунда"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsPositive()
    @IsOptional()
    maxValue: number;

    @ApiPropertyOptional({type: Number, description: "Сколько дней нельзя выводить"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @Min(0)
    @IsOptional()
    holdDays: number;

    @ApiPropertyOptional({type: Boolean, description: "Это текущий раунд"})
    @Prop({index: true, required: true, type: Boolean})
    @IsBoolean()
    @IsOptional()
    isCurrent: boolean;

    @ApiProperty({type: String, required: true, description: "Символ токена или индекса", enum:Symbol})
    @Prop({index: true, required: true, type: String, enum:Symbol})
    @IsOptional()
    @IsEnum(Symbol)
    readonly symbol: Symbol;


    @ApiProperty({type: String, required: true, description: "Тип сейла", enum:SaleType})
    @Prop({index: true, required: true, type: String, enum:SaleType})
    @IsOptional()
    @IsEnum(SaleType)
    readonly type: SaleType;


    @ApiProperty({type: String, required: true, description: "Название раунда"})
    @Prop({index: true, required: true, type: String})
    @IsOptional()
    @IsString()
    readonly name: string;

    @ApiPropertyOptional({type: Number, description: "Цена"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    priceUsd: number;

}

export type SaleTokenDocument = SaleToken & Document;
export const SaleTokenSchema = SchemaFactory.createForClass(SaleToken);


SaleTokenSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj["__v"];
    return obj;
};
