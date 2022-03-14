import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {SwapTokenDto} from "src/token/dto/swap-token.dto";
import {Types} from "mongoose";
import {CurrencyService} from "src/currency/currency.service";
import {Symbol} from "src/currency/currency.schema";
import {OperationType} from "src/operation/operation.schema";
import {UserService} from "src/user/user.service";
import {SwapTokenResponse} from "src/token/dto/swap-token.response";
import {Exceptions} from "src/enums/exceptions.enum";
import {BonusToken} from "src/token/bonus-token.schema";
import {BonusTokenService} from "src/token/bonus-token.service";
import {SaleTokenService} from "src/token/sale-token.service";
import {SaleToken} from "src/token/sale-token.schema";

@Injectable()
export class TokenService {

    constructor(
        private readonly userService:UserService,
        private readonly  bonusTokenService:BonusTokenService,
        private readonly  saleTokenService:SaleTokenService,
    ) {
    }


    async swap(userId: Types.ObjectId, dto: SwapTokenDto):Promise<SwapTokenResponse> {
        const saleTokens:SaleToken[] = await this.saleTokenService.list();

        const isBuyToken = saleTokens.find(x=>x.symbol===dto.toSymbol)
        const isSellToken = saleTokens.find(x=>x.symbol===dto.fromSymbol)

        if( !dto.fromAmount || dto.fromAmount<=0 ) throw new HttpException(Exceptions.INCORRECT_TYPE, HttpStatus.BAD_REQUEST);

        if( isBuyToken ){
            const sale = await this.saleTokenService.getCurrent(dto.toSymbol);
            if(sale && sale.value>sale.maxValue) throw new HttpException(Exceptions.SALE_COMPLETE, HttpStatus.CONFLICT)
        }

        const minused = await this.userService.walletIncrement(userId,dto.fromSymbol,-dto.fromAmount,OperationType.TOKEN_SWAP)
        const toAmount = CurrencyService.fromTo(dto.fromSymbol, dto.toSymbol, dto.fromAmount);
        if(!toAmount || toAmount<=0) throw new HttpException(Exceptions.CURRENCY_ERROR, HttpStatus.CONFLICT)
        const {operations, user} = await this.userService.walletIncrement(userId, dto.toSymbol, toAmount, OperationType.TOKEN_SWAP, minused.operations[0]._id);

        if(isBuyToken) this.saleTokenService.IncrementValue(dto.toSymbol, toAmount)
        if(isSellToken) this.saleTokenService.IncrementValue(dto.fromSymbol, -dto.fromAmount)

        const bonusTokensList: BonusToken[] = await this.bonusTokenService.bonusList();
        for (let i = 0; i < user.fathers.length && i < bonusTokensList.length; i++) {
            const {percent, bonusAsGetSymbol} = bonusTokensList[i];
            const fatherId = user.fathers[i]
            const targetOperationsForBonus = bonusAsGetSymbol ? operations : minused.operations;

            for (let o = 0; o < targetOperationsForBonus.length; o++) {
                const operation = targetOperationsForBonus[o];
                const updateUser = o === targetOperationsForBonus.length - 1;
                await this.userService.walletIncrement(fatherId, operation.symbol, Math.abs(operation.amount * percent / 100), OperationType.TOKEN_REF_BONUS, operation._id, undefined, undefined, user._id, updateUser)
            }
        }

        return {user, operations:[...minused.operations, ...operations]};
    }
}
