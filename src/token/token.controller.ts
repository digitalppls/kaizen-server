import {
    Body,
    CacheInterceptor,
    CacheTTL,
    Controller,
    Get, HttpException, HttpStatus,
    Param,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags} from "@nestjs/swagger";
import {RequestModel} from "src/auth/auth.middleware";
import {SwapTokenDto} from "src/token/dto/swap-token.dto";
import {TokenService} from "src/token/token.service";
import {SwapTokenResponse} from "src/token/dto/swap-token.response";
import {RateLimiterGuard} from "src/guard/rateLimiter.guard";
import {Throttle} from "@nestjs/throttler";
import {ListBonusTokenResponse} from "src/token/dto/list-bonus-token.response";
import {BonusTokenService} from "src/token/bonus-token.service";
import {BonusToken} from "src/token/bonus-token.schema";
import {ListSaleTokenResponse} from "src/token/dto/list-sale-token.response";
import {SaleTokenService} from "src/token/sale-token.service";
import {SaleToken, SaleType} from "src/token/sale-token.schema";
import {Symbol} from "src/currency/currency.schema"
import {Exceptions} from "src/enums/exceptions.enum";
import {User} from "src/user/user.schema";
import {IncrementDto} from "src/token/dto/increment.dto";
import {OperationType} from "src/operation/operation.schema";
import {UserService} from "src/user/user.service";
import {Types} from "mongoose";

@ApiTags("🪙 Токены")
@Controller('token')
@UseGuards(RateLimiterGuard)
export class TokenController {

    constructor(
        private readonly tokenService: TokenService,
        private readonly saleTokenService: SaleTokenService,
        private readonly bonusTokenService: BonusTokenService,
        private readonly userService:UserService
    ) {
    }


    // Bonus



    @UseInterceptors(CacheInterceptor)
    @Get(":symbol/sale/list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список сейлов токена", description: ""})
    @ApiResponse({status: 201, type: ListSaleTokenResponse})
    @ApiParam({name: "symbol", type: String, enum: [...Object.values(Symbol),'all'], example:"all", description:"Or use 'all' for return all"})
    @Throttle(100, 10)
    async saleList(@Param("symbol") symbol: Symbol | string): Promise<ListSaleTokenResponse> {
        const list = await this.saleTokenService.list(symbol === 'all' ? null : symbol as Symbol);
        return {list}
    }

    @Post("sale/save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение сейлов",
        description: "Добавление сейла  / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @ApiResponse({status: 201, type: ListSaleTokenResponse})
    async saleSave(@Body() saleToken: SaleToken): Promise<ListSaleTokenResponse> {
        await this.saleTokenService.save(saleToken);
        const list = await this.saleTokenService.list(saleToken.symbol);
        return {list}
    }



    // Sale

    @UseInterceptors(CacheInterceptor)
    @Get("bonus/list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список реферальных вознаграждений", description: ""})
    @ApiResponse({status: 201, type: ListBonusTokenResponse})
    @Throttle(100, 10)
    async refBonusList(): Promise<ListBonusTokenResponse> {
        const list = await this.bonusTokenService.bonusList();
        return {list}
    }

    @Post("bonus/save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение реферальных бонусов",
        description: "Добавление линии реферальных вознаграждений / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @ApiResponse({status: 201, type: ListBonusTokenResponse})
    async statusAdd(@Body() refBonus: BonusToken): Promise<ListBonusTokenResponse> {
        await this.bonusTokenService.save(refBonus);
        const list = await this.bonusTokenService.bonusList();
        return {list}
    }


    // Swap

    @Post("swap")
    @ApiBearerAuth()
    @UseGuards(RateLimiterGuard)
    @Throttle(10,10)
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Обмен токенов. Покупка или продажа", description: ""})
    @ApiResponse({status: 201, type: SwapTokenResponse})
    async swap(@Request() req: RequestModel, @Body() dto: SwapTokenDto): Promise<SwapTokenResponse> {
        if(dto.fromSymbol===dto.toSymbol) throw new HttpException(Exceptions.CURRENCY_ERROR, HttpStatus.BAD_REQUEST);
        if( !dto.fromAmount || dto.fromAmount<=0 ) throw new HttpException(Exceptions.INCORRECT_TYPE, HttpStatus.BAD_REQUEST);
        const {user, operations} = await this.tokenService.swap(req.userId, dto)
        return {user, operations}
    }

    @Get("swap/:symbol/limit")
    @ApiBearerAuth()
    @UseGuards(RateLimiterGuard)
    @Throttle(10,10)
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Информация о доступном для вывода количестве токенов", description: ""})
    @ApiResponse({status: 201, type: Number})
    async swapLimit(@Request() req: RequestModel, @Param("symbol") symbol: Symbol): Promise<Number> {
        return this.tokenService.swapLimit(req.userId, symbol)
    }

    @Get("swap/list")
    @UseGuards(RateLimiterGuard)
    @Throttle(10,10)
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Информация о возможных направлениях обмена", description: ""})
    @ApiResponse({status: 201, type: Number})
    swapList(@Request() req: RequestModel): [Symbol,Symbol][] {
        return this.tokenService.swapList()
    }



    @Post("increment")
    @ApiTags("👨🏻‍💼 Админ")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Инкриминация токенов пользователей (👨🏻‍💼)", description: ""})
    @ApiResponse({status: 201, type: User})
    @ApiBody({type:IncrementDto})

    async increment(@Request() req: RequestModel, @Body() dto:IncrementDto): Promise<User> {
        let {userId, symbol, amount} = dto;
        userId = Types.ObjectId(userId+'')
        if(amount>0) {
            await this.saleTokenService.increment(SaleType.OWNER_FUND, symbol, -Math.abs(amount))
            const {user,operations} = await this.userService.walletIncrement(userId, symbol, Math.abs(amount), OperationType.BALANCE_UPDATE, undefined,undefined, undefined, req.userId  );
            return user;
        }
        else if(amount<0) {
            const {user,operations} = await this.userService.walletIncrement(userId, symbol, -Math.abs(amount), OperationType.BALANCE_UPDATE, undefined,undefined, undefined, req.userId  );
            await this.saleTokenService.increment(SaleType.OWNER_FUND, symbol, Math.abs(amount))
            return user;
        }
    }
}
