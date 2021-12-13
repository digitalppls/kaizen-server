import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiProperty} from "@nestjs/swagger";
import {Document, Types} from 'mongoose';
import {User} from "src/user/user.schema";
import {Product} from "src/product/product.schema";


@Schema()
export class UserProduct {

    @ApiProperty({type: User, description:  "Владелец продукта"})
    @Prop({index:true, required:true, type: Types.ObjectId, ref:"User"})
    user:User | Types.ObjectId;

    @ApiProperty({type: Product, description:  "Продукт"})
    @Prop({index:true, required:true, type: Types.ObjectId, ref:"Product"})
    product:Product | Types.ObjectId;

    @ApiProperty({type: Number, description:  "Цена в $"})
    @Prop({index:true, required:true, type:Number})
    priceUsd:number;



    @ApiProperty({type: Date, description:  "Дата начала действия"})
    @Prop({index:true, required:true, type:Date})
    dateStart:Date;

    @ApiProperty({type: Date, description:  "Дата завершения действия"})
    @Prop({index:true, required:true, type:Date})
    dateEnd:Date;



    _id: Types.ObjectId;
}

export type UserProductDocument = UserProduct & Document;
export const UserProductSchema = SchemaFactory.createForClass(UserProduct);

UserProductSchema.methods.toJSON =  function (){
    const obj = this.toObject();
    delete obj.__v;
    if(obj['user']) delete obj['user']['password'];
    return obj;
};
