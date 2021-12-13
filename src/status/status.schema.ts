import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from 'mongoose';
import {Symbol} from "src/currency/currency.schema";


@Schema()
export class Status {


    @ApiPropertyOptional({type: Number, description:  "id статуса"})
    @Prop({index:true, required:true, type:Number})
    id:number;


    @ApiPropertyOptional({type: String, description:  "Наиминование статуса"})
    @Prop({index:true, required:true, type:String})
    name:string;


    @ApiPropertyOptional({type: Number, description:  "Сумма собственных инвистиций в $"})
    @Prop({index:true, required:true, type:Number})
    self_invest_usd:number;


    @ApiPropertyOptional({type: Number, description:  "Сумма инвистиций структуры в $"})
    @Prop({index:true, required:true, type:Number})
    structure_invest_usd:number;

    @ApiPropertyOptional({type: Number, description:  "Сумма инвистиций первого ряда в $"})
    @Prop({index:true, required:true, type:Number})
    first_line_invest_usd:number;

    @ApiPropertyOptional({type: Number, description:  "Сумма вознаграждения за достижения этих условий. в $"})
    @Prop({index:true, required:true, type:Number})
    prize_usd:number;

    @ApiPropertyOptional({type: String, enum:Symbol, description:  "В какой валюте начислять награду"})
    @Prop({index:true, required:true, type:String, enum:Symbol})
    prize_symbol:Symbol;


    @ApiPropertyOptional({type: Number, description:  "Сколько $ начислить на один из существующих пакетных счетов"})
    @Prop({index:true, required:true, type:Number})
    package_up_usd:number;


    @ApiPropertyOptional({type: Number, description:  "Дополнительный процент к бонусу за покупки пакетов партнерами"})
    @Prop({index:true, required:false, type:Number, default:0})
    package_bonus_add_percent:number;

    @ApiPropertyOptional({type: String, description:  "_id записи"})
    _id: Types.ObjectId;
}

export type StatusDocument = Status & Document;
export const StatusSchema = SchemaFactory.createForClass(Status);

StatusSchema.methods.toJSON =  function (){
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};
