import {CacheKey, CacheTTL, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";

import {Exceptions} from "src/enums/exceptions.enum";
import {Symbol} from "src/currency/currency.schema";
import {SaleToken, SaleTokenDocument} from "src/token/sale-token.schema";
import {Interval} from "@nestjs/schedule";
import {CurrencyService} from "src/currency/currency.service";

@Injectable()
export class SaleTokenService {
    constructor(
        private readonly currencyService:CurrencyService,
        @InjectModel(SaleToken.name) private saleTokenModel: Model<SaleTokenDocument>,
    ) {
        this.saveCurrentPriceToCurrency().then()
    }


    @CacheTTL(5)
    @CacheKey("SaleToken")
    async list(symbol?: Symbol): Promise<SaleToken[]> {
        return this.saleTokenModel.find(symbol?{symbol}:{}).sort({round: 1})
    }





    async save(refBonus: SaleToken): Promise<SaleToken> {
        const values = Object.values(refBonus).filter(x => x)
        console.log(values);
        if (values.length === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (values.length === 1 && refBonus._id)
            return this.saleTokenModel.findByIdAndRemove(refBonus._id);
        else if (refBonus._id)
            return this.saleTokenModel.findByIdAndUpdate(refBonus._id, {$set: refBonus});
        else
            return this.saleTokenModel.create(refBonus)
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

    IncrementValue(symbol:Symbol, value: number) {
        this.saleTokenModel.updateOne({symbol, isCurrent:true},{$inc:{value}}).then()
    }

    @Interval(10000)
    private async saveCurrentPriceToCurrency() {
        const sales = await this.saleTokenModel.find({isCurrent:true}).sort({round: -1});
        this.currencyService.SaveInternalTokensPrices(sales).then()
    }
}
