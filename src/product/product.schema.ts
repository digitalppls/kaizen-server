import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from 'mongoose';

export class ProductDynamicPrice {
    name:string;
    priceUsd:number;
}

@Schema()
export class Product {


    @ApiPropertyOptional({type: String, description:  "Наиминование продукта"})
    @Prop({index:true, required:true, type:String})
    name:string;

    @ApiPropertyOptional({type: Number, description:  "Цена в $"})
    @Prop({index:true, required:true, type:Number})
    priceUsd:number;


    @ApiPropertyOptional({type: Number, description:  "Срок действия в днях"})
    @Prop({index:true, required:true, type:Number})
    termDays:number;

    @ApiPropertyOptional({type: String, description:  "_id "})
    _id: Types.ObjectId;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);




ProductSchema.methods.toJSON =  function (){
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};
