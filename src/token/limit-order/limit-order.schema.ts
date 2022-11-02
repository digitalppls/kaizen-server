import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from 'mongoose';
import {Symbol} from "../../currency/currency.schema";
import {IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsNumberString, IsOptional, Min} from "class-validator";
import {Type} from "class-transformer";
import {UserSchema} from "src/user/user.schema";


export enum LimitOrderDirection {
    BUY="buy",
    SELL="sell"
}

@Schema({autoIndex: false, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class LimitOrder {


    @ApiPropertyOptional({type: String, description:  "_id Пользователя"})
    @Prop({index:true, required:true, type:Types.ObjectId})
    @IsOptional()
    @IsNotEmpty()
    @IsMongoId()
    userId:Types.ObjectId;

    @ApiPropertyOptional({type: String, description:  "Пользователь желает продать или купить токены", enum:LimitOrderDirection})
    @Prop({index:true, required:true, type:String, enum:LimitOrderDirection})
    @IsOptional()
    @IsNotEmpty()
    @IsEnum(LimitOrderDirection)
    direction:LimitOrderDirection;


    @ApiPropertyOptional({type: String, description:  "символ токена", enum:Symbol})
    @Prop({index:true, required:true, type:String, enum:Symbol})
    @IsOptional()
    @IsNotEmpty()
    @IsEnum(Symbol)
    symbol:Symbol;


    @ApiPropertyOptional({type: Number, description:  "Сумма токенов"})
    @Prop({index:true, required:true, type:Number})
    @IsOptional()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    amount:number;


    @ApiPropertyOptional({type: Number, description:  "цена в $"})
    @Prop({index:true, required:true, type:Number})
    @IsOptional()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceUsd:number;


    // Дата регистрации
    @ApiPropertyOptional({type: Date, description:  "Дата"})
    @IsOptional()
    @Prop({default: Date.now, required: false})
    date?: Date;


    @ApiPropertyOptional({type: String, description:  "_id записи"})
    @IsOptional()
    @IsNotEmpty()
    @Type(() => Types.ObjectId)
    @IsMongoId()
    _id: Types.ObjectId;
}


export type LimitOrderDocument = LimitOrder & Document;
export const LimitOrderSchema = SchemaFactory.createForClass(LimitOrder);

LimitOrderSchema.virtual('user', {ref: 'User', localField: 'userId', foreignField: '_id', justOne: true, options:{}});


LimitOrderSchema.methods.toJSON =  function (){
    const obj = this.toObject();
    delete obj.__v;
    if(obj['user']) {
        delete obj['user'].password;
        delete obj['user'].wallet33Assets;
        delete obj['user'].permissions;
        delete obj['user'].email
        delete obj['user'].fathers
        delete obj['user'].__v
    }
    return obj;
};
