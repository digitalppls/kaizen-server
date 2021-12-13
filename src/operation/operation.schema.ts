import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Document, Types} from 'mongoose';
import {Symbol} from "src/currency/currency.schema";

export class AggregateSumId{
    @ApiProperty()
    userId:Types.ObjectId;
    @ApiProperty()
    type:OperationType;
}

export class AggregateSum{
    @ApiProperty()
    _id: AggregateSumId;
    @ApiProperty()
    amountUsd:number;
}

export enum OperationType {
    ALL = "all",
    PAYMENT = "payment",
    WITHDRAW = "withdraw",
    PRODUCT_BUY = "product_buy",
    TOKEN_SWAP = "token_swap",
    PRODUCT_REF_BONUS = "product_ref_bonus",
    PRODUCT_BUY_BONUS = "product_buy_bonus",
    PACKAGE_REF_BONUS = "package_ref_bonus",
    STATUS_UP_BONUS = "status_up_bonus",
    STATUS_UP_BONUS_PACKAGE = "status_up_bonus_package",
    PACKAGE_BUY = "package_buy",
    PACKAGE_FARMING = "package_farming",
    PACKAGE_WITHDRAW = "package_withdraw",
    TOKEN_SWAP_FEE = "token_swap_fee",
    PACKAGE_BUY_FEE = "package_buy_fee",
    CRYPTO_WALLET_CHANGE="crypto_wallet_change",
    TOKEN_REF_BONUS = "token_ref_bonus",
}

export enum OperationStatus {
    REQUESTED = "requested",
    CONFIRMED = "confirmed",
    PENDING = "pending",
    FAIL = "fail",
    TRANSACTION = "transaction",
    WAIT_VERIFICATION = "wait_verification",
    CANCELED = "canceled"
}


@Schema()
export class Operation {

    @ApiProperty({type: Number, description: "Сумма"})
    @Prop({index: true, required: true, type: Number})
    amount: number;

    @ApiProperty({type: Number, description: "Сумма в $"})
    @Prop({index: true, required: true, type: Number})
    amountUsd: number;

    @ApiProperty({type: String, enum:Symbol, description: "Валюта "})
    @Prop({index: true, required: true, type: String, enum:Symbol})
    symbol: Symbol;

    @ApiProperty({type: Date, description: "Дата "})
    @Prop({index: true, type: Date, required: false, default: Date.now})
    date: Date;

    @ApiProperty({type: Types.ObjectId, description: "id пользователя"})
    @Prop({index: true, required: true, type: Types.ObjectId})
    userId: Types.ObjectId;

    @ApiProperty({type: String, description: "Тип операции", enum: OperationType})
    @Prop({index: true, required: true, type: String, enum: OperationType})
    type: string;

    @ApiProperty({type: Types.ObjectId, description: "Опция. id связанного с операцией объекта"})
    @Prop({index: true, required: false, type: Types.ObjectId})
    targetId?: Types.ObjectId;

    @ApiPropertyOptional({type: String, description: "Опция. Статус операции", enum: OperationStatus})
    @Prop({index: true, required: false, type: String})
    status?: OperationStatus;

    @ApiPropertyOptional({type: String, description: "Опция. hash операции"})
    @Prop({index: true, required: false, type: String})
    hash?: string;

    @ApiPropertyOptional({type: Types.ObjectId, description: "_id покупателя, за которого получили бонус"})
    @Prop({index: true, required: false, type: Types.ObjectId})
    customerId?: Types.ObjectId;

    @ApiPropertyOptional({type: Number, description: "Опция. Линия в партнерской структуре, из которой прошла операция. Указывается при типе LINEAR_BONUS и др"})
    @Prop({index: true, required: false, type: Number})
    line?: number;

    _id: Types.ObjectId;
}

export type OperationDocument = Operation & Document;
export const OperationSchema = SchemaFactory.createForClass(Operation);


OperationSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};
