import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {SwapTokenDto} from "src/token/dto/swap-token.dto";
import {Types} from "mongoose";
import {Symbol} from "src/currency/currency.schema";
import {CurrencyService} from "src/currency/currency.service";
import {Operation, OperationType} from "src/operation/operation.schema";
import {UserService} from "src/user/user.service";
import {SwapTokenResponse} from "src/token/dto/swap-token.response";
import {Exceptions} from "src/enums/exceptions.enum";
import {BonusToken} from "src/token/bonus-token.schema";
import {BonusTokenService} from "src/token/bonus-token.service";
import {SaleTokenService} from "src/token/sale-token.service";
import {SaleToken, SaleType} from "src/token/sale-token.schema";
import {OperationService} from "src/operation/operation.service";

@Injectable()
export class TokenService {

    constructor(
        private readonly userService: UserService,
        private readonly bonusTokenService: BonusTokenService,
        private readonly saleTokenService: SaleTokenService,
        private readonly operationService: OperationService
    ) {
    }


    async swap(userId: Types.ObjectId, dto: SwapTokenDto): Promise<SwapTokenResponse> {
        if(!this.swapList().find(x=>x[0]===dto.fromSymbol && x[1]===dto.toSymbol)) throw new HttpException(Exceptions.INCORRECT_SWAP_DIRECTION, HttpStatus.CONFLICT);
        const saleTokens: SaleToken[] = await this.saleTokenService.list();


        const isBuyToken = saleTokens.find(x => x.symbol === dto.toSymbol)
        const isSellToken = saleTokens.find(x => x.symbol === dto.fromSymbol)

        if (isSellToken) {
            const limit = await this.swapLimit(userId, dto.fromSymbol);
            if (limit < dto.fromAmount) throw new HttpException(Exceptions.INSUFFICIENT_UNLOCKED_TOKENS, HttpStatus.CONFLICT)
        }

        const toAmount = CurrencyService.fromTo(dto.fromSymbol, dto.toSymbol, dto.fromAmount);
        if (!toAmount || toAmount <= 0) throw new HttpException(Exceptions.CURRENCY_ERROR, HttpStatus.CONFLICT)

        // Отнимаем из текущего фонда
        if (isBuyToken) await this.saleTokenService.increment("current", dto.toSymbol, -toAmount)

        // Отнимаем у пользователя
        const minused = await this.userService.walletIncrement(userId, dto.fromSymbol, -dto.fromAmount, OperationType.TOKEN_SWAP)

        // Отдаем пользователю
        const line = isBuyToken ? saleTokens.find(x => x.symbol === dto.toSymbol && x.isCurrent === true)?.round : undefined;
        const {
            operations,
            user
        } = await this.userService.walletIncrement(userId, dto.toSymbol, toAmount, OperationType.TOKEN_SWAP, minused.operations[0]._id, undefined, undefined, undefined, undefined, line);

        // Прибавляем в фонде владельца
        if (isSellToken) await this.saleTokenService.increment(SaleType.OWNER_FUND, dto.fromSymbol, +dto.fromAmount)

        if (isBuyToken && !isSellToken) {
            const bonusTokensList: BonusToken[] = (await this.bonusTokenService.bonusList()).filter(x=>x.toSymbol===dto.toSymbol).sort((a,b)=>a.line<b.line?-1:1);
            for (let i = 0; i < user.fathers.length && i < bonusTokensList.length; i++) {
                // console.log(bonusTokensList, i)
                const {percent, bonusAsGetSymbol} = bonusTokensList[i];
                const fatherId = user.fathers[i]
                const targetOperationsForBonus = bonusAsGetSymbol ? operations : minused.operations;

                for (let o = 0; o < targetOperationsForBonus.length; o++) {
                    const operation = targetOperationsForBonus[o];
                    const updateUser = o === targetOperationsForBonus.length - 1;
                    const amount = Math.abs(operation.amount * percent / 100);
                    await this.saleTokenService.increment(SaleType.REWARD_FUND, operation.symbol, -amount);
                    await this.userService.walletIncrement(fatherId, operation.symbol, +amount, OperationType.TOKEN_REF_BONUS, operation._id, undefined, undefined, user._id, updateUser)
                }
            }
        }

        return {user, operations: [...minused.operations, ...operations]};
    }

    async swapLimit(userId: Types.ObjectId, symbol: Symbol): Promise<number> {
        const saleTokens: SaleToken[] = await this.saleTokenService.list(symbol);
        if(!saleTokens.map(x=>x.symbol).includes(symbol))return Infinity;
        const operationsSwapToken: Operation[] = await this.operationService.listAllTokenSwaps(userId, symbol);
        let limit = 0;
        for (let op of operationsSwapToken.filter(x => x.amount > 0)) {
            const sale = saleTokens.find(x => x.round === op.line);
            if (sale) {
                const leftDays = Math.floor((new Date().getTime() - op.date.getTime()) / 86400000);
                const leftPercent = Math.min(leftDays, sale.holdDays) / sale.holdDays;
                limit += op.amount * leftPercent;
            }
        }
        const minuses = operationsSwapToken.filter(x => x.amount < 0).map(x => x.amount).reduce((a, b) => a + b, 0)
        limit += minuses;
        return limit || 0;
    }

    swapList(): [Symbol, Symbol][] {
        return [
            [Symbol.USDT, Symbol.SRK],
            [Symbol.USDT, Symbol.KZN],
            [Symbol.USDT, Symbol.VNG],
            [Symbol.BUSD, Symbol.SRK],
            [Symbol.BUSD, Symbol.KZN],
            [Symbol.BUSD, Symbol.VNG],
            [Symbol.USDC, Symbol.SRK],
            [Symbol.USDC, Symbol.KZN],
            [Symbol.USDC, Symbol.VNG],
            [Symbol.BNB, Symbol.SRK],
            [Symbol.BNB, Symbol.KZN],
            [Symbol.BNB, Symbol.VNG],

            [Symbol.SRK, Symbol.USDT],
            [Symbol.KZN, Symbol.USDT],
            [Symbol.VNG, Symbol.USDT],


            [Symbol.SRK, Symbol.KZN],
            [Symbol.SRK, Symbol.VNG],


            [Symbol.KZN, Symbol.SRK],
            [Symbol.KZN, Symbol.VNG],

            [Symbol.VNG, Symbol.KZN],
            [Symbol.VNG, Symbol.SRK],
            ]
    }
}
