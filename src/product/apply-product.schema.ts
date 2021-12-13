import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from 'mongoose';
import {IsEmail, IsOptional, IsPhoneNumber} from "class-validator";


@Schema()
export class ApplyProduct {


    @Prop({index:true, required:true, type:String})
    @ApiProperty({type: String, required: true, description: "Имя пользователя"})
    name: string;

    @Prop({index:true, required:true, type:String})
    @IsPhoneNumber()
    @ApiProperty({type: String, required: true, description: "телефон пользователя"})
    phone: string;

    @IsEmail()
    @Prop({index:true, required:true, type:String})
    @ApiProperty({type: String, required: true, description: "email пользователя"})
    email: string;

    @IsOptional()
    @Prop({index:true, required:false, type:String})
    @ApiPropertyOptional({type:String, required:false, description:"12 months (в некоторых заявках этого поля может не быть)"})
    term:string;


    @IsOptional()
    @Prop({index:true, required:false, type:String})
    @ApiPropertyOptional({type:String, required:false, description:"$100500 (в некоторых заявках этого поля может не быть)\n"})
    price:string;

    @Prop({index:true, required:false, type:String})
    @ApiProperty({type:String, required:false, description:"house-business"})
    service:string;

    @Prop({default: Date.now, required: false})
    date: Date;

    _id: Types.ObjectId;
}

export type ApplyProductDocument = ApplyProduct & Document;
export const ApplyProductSchema = SchemaFactory.createForClass(ApplyProduct);




ApplyProductSchema.methods.toJSON =  function (){
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};
