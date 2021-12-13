import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from "mongoose";
import {Package} from "src/package/package.schema";



@Schema()
export class UserPackage {

    @ApiProperty({type: String, description: "_id"})
    _id: Types.ObjectId;

    @ApiProperty({type: String, description: "user _id"})
    @Prop({index: true, required: true, type: Types.ObjectId})
    userId: Types.ObjectId;

    @ApiPropertyOptional({type: Package, description: "Инвестиционный пакет"})
    @Prop({index: true, required: true, type: Types.ObjectId, ref: "Package"})
    package: Package | Types.ObjectId;

    @ApiPropertyOptional({type: Number, description: "Вложенная сумма"})
    @Prop({index: true, required: true, type: Number})
    investedAmountUsd: number;

    @ApiPropertyOptional({type: Number, description: "Накопленная сумма"})
    @Prop({index: true, required: false, type: Number, default:0})
    farmedAmountUsd: number;

    @ApiPropertyOptional({type: Number, description: "Выведенная сумма"})
    @Prop({index: true, required: false, type: Number, default:0})
    withdrawnAmountUsd: number;

    @ApiPropertyOptional({type: Date, description: "Дата создания/покупки"})
    @Prop({index: true, required: false, type: Date, default: Date.now})
    date: Date;

    @ApiPropertyOptional({type: Date, description: "Дата последнего вывода"})
    @Prop({index: true, required: false, type: Date, default: Date.now})
    withdrawnDate: Date;


    @ApiPropertyOptional({type: Boolean, default:false, description:"Можно ли что-то выводить или еще нет"})
    canWithdraw: boolean;


}

export type UserPackageDocument = UserPackage & Document;
export const UserPackageSchema = SchemaFactory.createForClass(UserPackage);



UserPackageSchema.methods.toJSON = function () {
    const obj= this.toObject() as UserPackageDocument;


    console.log(obj)
    const withdrawDate = new Date(obj.withdrawnDate)
    const accessedWithdrawDate = new Date();
    accessedWithdrawDate.setDate(accessedWithdrawDate.getDate()-(obj.package as Package).withdrawIntervalDays);
    obj.canWithdraw = (withdrawDate<=accessedWithdrawDate && obj.farmedAmountUsd>obj.withdrawnAmountUsd)

    delete obj.__v;
    return obj;
};
