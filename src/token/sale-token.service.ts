import {
    HttpException,
    HttpStatus,
    Injectable,
    UseInterceptors
} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";

import {Exceptions} from "src/enums/exceptions.enum";
import {Symbol} from "src/currency/currency.schema";
import {SaleToken, SaleTokenDocument, SaleType} from "src/token/sale-token.schema";
import {Interval} from "@nestjs/schedule";
import {CurrencyService} from "src/currency/currency.service";
import {Wallet} from "src/wallet/wallet.schema";

@Injectable()
export class SaleTokenService {
    constructor(
        private readonly currencyService:CurrencyService,
        @InjectModel(SaleToken.name) private saleTokenModel: Model<SaleTokenDocument>,
    ) {
        this.saveCurrentPriceToCurrency().then()
    }


    async list(symbol?: Symbol): Promise<SaleToken[]> {
        console.log("find")
        return this.saleTokenModel.find(symbol?{symbol}:{}).sort({round: 1})
    }

    async save(item: SaleToken): Promise<SaleToken> {
        const valuesLength = Object.values(item).length
        if (valuesLength === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (valuesLength === 1 && item._id)
            return this.saleTokenModel.findByIdAndRemove(item._id);
        else if (item._id) {
            const updated = await this.saleTokenModel.findByIdAndUpdate(item._id, {$set: item},{new:true});
            if(updated.isCurrent) await this.saleTokenModel.updateMany({isCurrent:true, _id:{$ne:updated._id}, symbol:updated.symbol},{$set:{isCurrent:false}});
            return updated;
        }
        else
            return this.saleTokenModel.create(item)
    }

    async getCurrent(symbol:Symbol):Promise<SaleToken> {
        let sale = await this.saleTokenModel.findOne({symbol, isCurrent:true}).sort({round:-1});
        if(sale.value>=sale.maxValue) {
            let nextSale = await  this.saleTokenModel.findOneAndUpdate({symbol, round:sale.round+1, isCurrent:false},{$set:{isCurrent:true}},{new:true});
            if( nextSale ) {
                this.saleTokenModel.updateOne({_id:sale._id},{$set:{isCurrent:false}}).then()
                return nextSale;
            } else return sale;
        }
        return sale;
    }


    async increment(type: SaleType | "current", symbol: Symbol, value: number): Promise<SaleToken> {

        const validator = value < 0 ? {$where: `this.value + ${Math.abs(value)} <= this.maxValue`} : {}
        const filter = type==="current" ? {isCurrent:true, symbol, ...validator} : {type, symbol, ...validator};
        const increment = await this.saleTokenModel.findOneAndUpdate(filter, {$inc: {value:-1 * value}}, {
            upsert: value > 0,
            new: true
        });

        if (!increment) {
            console.log(filter)
            if (value < 0) throw new HttpException(Exceptions.INSUFFICIENT_FUND_BALANCE, HttpStatus.PAYMENT_REQUIRED);
            else throw new HttpException(Exceptions.UNKNOWN_ERROR, HttpStatus.CONFLICT);
        }
        return increment;
    }


    @Interval(10000)
    private async saveCurrentPriceToCurrency() {
        const sales = await this.saleTokenModel.find({isCurrent:true}).sort({round: -1});
        this.currencyService.SaveInternalTokensPrices(sales).then()
    }
}
