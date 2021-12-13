import {CacheKey, CacheTTL, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";

import {Exceptions} from "src/enums/exceptions.enum";
import {UserService} from "src/user/user.service";
import {BonusProduct, BonusProductDocument} from "src/product/bonus-product.schema";

@Injectable()
export class BonusProductService {
    constructor(
        private readonly userService: UserService,
        @InjectModel(BonusProduct.name) private refBonusModel: Model<BonusProductDocument>,
    ) {
    }


    @CacheTTL(10)
    @CacheKey("RefBonusList")
    async bonusList(): Promise<BonusProduct[]> {
        return this.refBonusModel.find({}).sort({line: 1})
    }


    async save(refBonus: BonusProduct): Promise<BonusProduct> {
        const values = Object.values(refBonus).filter(x => x)
        console.log(values);
        if (values.length === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (values.length === 1 && refBonus._id)
            return this.refBonusModel.findByIdAndRemove(refBonus._id);
        else if (refBonus._id)
            return this.refBonusModel.findByIdAndUpdate(refBonus._id, {$set: refBonus});
        else
            return this.refBonusModel.create(refBonus)
    }


}
