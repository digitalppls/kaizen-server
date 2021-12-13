import {CacheKey, CacheTTL, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";

import {Exceptions} from "src/enums/exceptions.enum";
import {UserService} from "src/user/user.service";
import {BonusToken, BonusTokenDocument} from "src/token/bonus-token.schema";

@Injectable()
export class BonusTokenService {
    constructor(
        private readonly userService: UserService,
        @InjectModel(BonusToken.name) private tokenBonusModel: Model<BonusTokenDocument>,
    ) {
    }


    @CacheTTL(10)
    @CacheKey("BonusToken")
    async bonusList(): Promise<BonusToken[]> {
        return this.tokenBonusModel.find({}).sort({line: 1})
    }


    async save(refBonus: BonusToken): Promise<BonusToken> {
        const values = Object.values(refBonus).filter(x => x)
        console.log(values);
        if (values.length === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (values.length === 1 && refBonus._id)
            return this.tokenBonusModel.findByIdAndRemove(refBonus._id);
        else if (refBonus._id)
            return this.tokenBonusModel.findByIdAndUpdate(refBonus._id, {$set: refBonus});
        else
            return this.tokenBonusModel.create(refBonus)
    }


}
