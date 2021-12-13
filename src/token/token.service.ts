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
    // async fcoin2oro(userId: Types.ObjectId, dto: SwapTokenDto):Promise<SwapTokenResponse> {
    //     const usd = CurrencyService.toUsd(Symbol.ORO, dto.toAmount);
    //     const fcoin = CurrencyService.fromUsd(Symbol.FCOIN, usd);
    //
    //     const minused = await this.userService.walletIncrement(userId, Symbol.FCOIN, -fcoin, OperationType.TOKEN_SWAP)
    //     const plused= await this.userService.walletIncrement(userId, Symbol.ORO, dto.toAmount, OperationType.TOKEN_SWAP, minused.operations[0]._id);
    //     return {user:plused.user, operations:[...minused.operations, ...plused.operations]};
    // }
    //
    // async fcash2fcoin(userId: Types.ObjectId, dto: SwapTokenDto):Promise<SwapTokenResponse> {
    //     const usd = CurrencyService.toUsd(Symbol.FCOIN, dto.toAmount);
    //     const fcash = CurrencyService.fromUsd(Symbol.FCASH, usd);
    //
    //     const minused = await this.userService.walletIncrement(userId, Symbol.FCASH, -fcash, OperationType.TOKEN_SWAP)
    //     const plused = await this.userService.walletIncrement(userId, Symbol.FCOIN, dto.toAmount, OperationType.TOKEN_SWAP, minused.operations[0]._id);
    //
    //     const oroFee = CurrencyService.fromUsd(Symbol.ORO, usd*0.10);
    //     let minusedFee = await this.userService.walletIncrement(userId, Symbol.ORO, -oroFee, OperationType.TOKEN_SWAP_FEE, plused.operations[0]._id)
    //     if(!minusedFee) {
    //         const fcoinFee = CurrencyService.fromUsd(Symbol.FCOIN, usd * 0.10);
    //         minusedFee = await this.userService.walletIncrement(userId, Symbol.FCOIN, -fcoinFee, OperationType.TOKEN_SWAP_FEE, plused.operations[0]._id)
    //     }
    //     return {user:minusedFee.user, operations:[...minused.operations, ...plused.operations,...minusedFee.operations]};
    // }
    //
    //
    //
    // async fcoin2fcash(userId: Types.ObjectId, dto: SwapTokenDto):Promise<SwapTokenResponse> {
    //     const usd = CurrencyService.toUsd(Symbol.FCASH, dto.toAmount);
    //     const fcoin = CurrencyService.fromUsd(Symbol.FCOIN, usd);
    //
    //     const minused = await this.userService.walletIncrement(userId, Symbol.FCOIN, -fcoin, OperationType.TOKEN_SWAP)
    //     const plused = await this.userService.walletIncrement(userId, Symbol.FCASH, dto.toAmount, OperationType.TOKEN_SWAP, minused.operations[0]._id);
    //
    //     const oroFee = CurrencyService.fromUsd(Symbol.ORO, usd * 0.10);
    //     let minusedFee = await this.userService.walletIncrement(userId, Symbol.ORO, -oroFee, OperationType.TOKEN_SWAP_FEE, plused.operations[0]._id)
    //     if(!minusedFee) {
    //         const fcashFee = CurrencyService.fromUsd(Symbol.FCASH, usd * 0.10);
    //         minusedFee = await this.userService.walletIncrement(userId, Symbol.FCASH, -fcashFee, OperationType.TOKEN_SWAP_FEE, plused.operations[0]._id)
    //     }
    //     return {user:minusedFee.user, operations:[...minused.operations, ...plused.operations,...minusedFee.operations]};
    // }

    async swap(userId: Types.ObjectId, dto: SwapTokenDto):Promise<SwapTokenResponse> {
        const saleTokens:SaleToken[] = await this.saleTokenService.list();

        const isBuyToken = saleTokens.find(x=>x.symbol===dto.toSymbol) && !saleTokens.find(x=>x.symbol===dto.fromSymbol)
        if( !isBuyToken ) throw new HttpException(Exceptions.INCORRECT_TYPE, HttpStatus.BAD_REQUEST);

        if( isBuyToken ){
            const sale = await this.saleTokenService.getCurrent(Symbol.VNG);
            if(sale && sale.value>sale.maxValue) throw new HttpException(Exceptions.SALE_COMPLETE, HttpStatus.CONFLICT)
        }

        const minused = await this.userService.walletIncrement(userId,dto.fromSymbol,-dto.fromAmount,OperationType.TOKEN_SWAP)
        const toAmount = CurrencyService.fromTo(dto.fromSymbol, dto.toSymbol, dto.fromAmount);
        if(!toAmount || toAmount<=0) throw new HttpException(Exceptions.CURRENCY_ERROR, HttpStatus.CONFLICT)
        const {operations, user} = await this.userService.walletIncrement(userId, dto.toSymbol, toAmount, OperationType.TOKEN_SWAP, minused.operations[0]._id);

        if(isBuyToken) this.saleTokenService.IncrementValue(dto.toSymbol, toAmount)

        const bonusTokensList: BonusToken[] = await this.bonusTokenService.bonusList();
        for (let i = 0; i < user.fathers.length && i < bonusTokensList.length; i++) {
            const {percent} = bonusTokensList[i];
            const fatherId = user.fathers[i]
            for (let o = 0; o < minused.operations.length; o++) {
                const operation = minused.operations[o];
                const updateUser = o === minused.operations.length - 1;
                await this.userService.walletIncrement(fatherId, operation.symbol, Math.abs(operation.amount * percent / 100), OperationType.TOKEN_REF_BONUS, operation._id, undefined, undefined, user._id, updateUser)
            }
        }

        return {user, operations:[...minused.operations, ...operations]};
    }
}
