import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {Document, Model, Types} from "mongoose";
import {Wallet} from "../wallet/wallet.schema";
import {CurrencyService} from "../currency/currency.service";
import {UserProduct} from "src/product/user-product.schema";

export enum UserPermission {
    SUPPORT = "support",
    STATUS_SAVE = "/api/status/save",
    PACKAGE_BONUS_SAVE = "/api/package/bonus/save",
    PRODUCT_BONUS_SAVE = "/api/product/bonus/save",
    PRODUCT_SAVE = "/api/product/save",
    PACKAGE_SAVE = "/api/package/save"
}

@Schema({autoIndex: true, toJSON: {virtuals: true}, toObject: {virtuals: true}})
export class User {

    @ApiProperty({type: String, description: "id Кошелька на Wallet33"})
    @Prop({index: true, required: false, type: Types.ObjectId})
    wallet33Id?: Types.ObjectId;

    @ApiProperty({type: [Object], description: "адреса Кошельков на Wallet33"})
    @Prop({index: false, required: false, type: Types.ObjectId})
    wallet33Assets?: { network: string, address: string }[];

    @ApiProperty({type: Number, description: "num_id"})
    @Prop({index: true, required: false, type: Number})
    num_id?: number;

    @ApiProperty({type: Number, description: "id в телеге"})
    @Prop({index: true, required: false, type: Number})
    chat_id?: number;

    @ApiProperty({type: Number, description: "Статус, по умолчанию 0 - нет статуса"})
    @Prop({index: true, required: false, type: Number, default:0})
    status?: number;

    @ApiProperty({type: String, description: "UserName в телеграм"})
    @Prop({index: true, required: false, type: String})
    username?: string;

    @ApiProperty({type: String, description: "login"})
    @Prop({index: true, required: false, type: String})
    login?: string;

    @ApiProperty({type: String, description: "Имя"})
    @Prop({index: true, required: false, type: String})
    first_name?: string;

    @ApiProperty({type: String, description: "Фамилия"})
    @Prop({index: true, required: false, type: String})
    last_name?: string;

    @ApiProperty({type: String, description: ""})
    @Prop({index: true, required: false, type: String})
    language_code?: string;

    @ApiProperty({type: String, description: "Массив родителей"})
    @Prop({index: true, required: false, type: [Types.ObjectId]})
    fathers?: Types.ObjectId[];

    @ApiProperty({
        enum: Object.values(UserPermission),
        type: [String],
        description: "Специальные разрешения на выполнения методов"
    })
    @Prop({index: true, required: false, type: [String], enum: Object.values(UserPermission)})
    permissions: string[];

    // Дата регистрации
    @Prop({default: Date.now, required: false})
    date: Date;

    @ApiProperty()
    _id: Types.ObjectId;

    @ApiProperty({type: [Wallet], description: "Балансы на кошельке"})
    wallets: Wallet[];

    @ApiProperty({type: [UserProduct], title: "Продукты пользователя", nullable:true, description:"! Возвращается не во всех методах"})
    products: UserProduct[];

    @ApiProperty({type: String, description: "Email"})
    @Prop({index: true, required: false, type: String})
    email?: string;

    @ApiProperty({type: Boolean, description: "Статус подтвержденности Email адреса"})
    @Prop({required: false, type: Boolean, default: false})
    emailVerified?: boolean;

    // @ApiProperty({ type: String, description: "Пароль" })
    @Prop({required: false, type: String})
    password?: string;

}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({login: 1}, {
    unique: true,
    partialFilterExpression: {
        'email': {$exists: true, $gt: ''}
    }
});


UserSchema.virtual('wallets', {ref: 'Wallet', localField: '_id', foreignField: 'userId', justOne: false});
UserSchema.virtual('products', {ref: 'UserProduct', localField: '_id', foreignField: 'user', justOne: false});

//
// const autoPopulateLead = function(next) {
//    // this.populate('status');
//     next();
// };
//
// UserSchema.pre('findOne', autoPopulateLead).pre('find', autoPopulateLead);
//


UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj["password"];
    delete obj["__v"];
    if (obj["wallets"]) {
        for (const wallet of obj["wallets"]) {
            wallet.amountUsd = CurrencyService.toUsd(wallet.symbol, wallet.amount);
        }
    }
    return obj;
};
