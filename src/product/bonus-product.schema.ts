import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {IsMongoId, IsNumber, IsOptional, IsPositive} from "class-validator";


@Schema({autoIndex: true, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class BonusProduct {

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

    @ApiPropertyOptional({type: Number, description: "Процент от суммы для вознаграждения"})
    @Prop({index: true, required: true, type: Number})
    @IsNumber()
    @IsOptional()
    percent: number;

}

export type BonusProductDocument = BonusProduct & Document;
export const BonusProductSchema = SchemaFactory.createForClass(BonusProduct);


BonusProductSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj["__v"];
    return obj;
};
