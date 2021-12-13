import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {IsMongoId, IsNumber, IsOptional, IsString} from "class-validator";


@Schema({autoIndex: true, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class Package {

    @ApiPropertyOptional({type: String, description: "_id"})
    @IsMongoId()
    @IsOptional()
    _id: Types.ObjectId;

    @ApiPropertyOptional({type: Number, description: "Уникальный ID"})
    @Prop({index: true, required: true, unique: true, type: Number})
    @IsNumber()
    @IsOptional()
    id: number;

    @ApiPropertyOptional({type: String, description: "Наиминование"})
    @Prop({index: true, required: true, type: String})
    @IsString()
    @IsOptional()
    name: string;

    @ApiPropertyOptional({type: String, description: "Принимаемые валюты через запятую", example: "fcoin"})
    @Prop({index: true, required: true, type: String})
    @IsString()
    @IsOptional()
    symbols: string;

    @ApiPropertyOptional({type: Number, description: "Минимальная сумма инвестиций"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    minAmountUsd: number;


    @ApiPropertyOptional({type: Number, description: "Максимальная сумма инвестиций"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    maxAmountUsd: number;


    @ApiPropertyOptional({type: Number, description: "Ежедневное начисление  % от"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    minDailyPercent: number;

    @ApiPropertyOptional({type: Number, description: "Ежедневное начисление  % до"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    maxDailyPercent: number;

    @ApiPropertyOptional({type: Number, description: "Интервал дней, через который доступен вывод"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    withdrawIntervalDays: number;

    @ApiPropertyOptional({type: Number, description: "Общая доходность / Максимальная"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    totalProfitPercent: number;


}

export type PackageDocument = Package & Document;
export const PackageSchema = SchemaFactory.createForClass(Package);


PackageSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj["__v"];
    return obj;
};
