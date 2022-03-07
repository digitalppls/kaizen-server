import {Body, Controller, Get, Param, Post, Request, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags} from "@nestjs/swagger";
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
import {SaleToken} from "src/token/sale-token.schema";
import {Symbol} from "src/currency/currency.schema"

@ApiTags("Token")
@Controller('token')
export class TokenController {

    constructor(
        private readonly tokenService: TokenService,
        private readonly saleTokenService: SaleTokenService,
        private readonly bonusTokenService: BonusTokenService,
    ) {
    }


    // Bonus

    @Get(":symbol/sale/list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список сейлов токена", description: ""})
    @ApiResponse({status: 201, type: ListSaleTokenResponse})
    @UseGuards(RateLimiterGuard)
    @ApiParam({name: "symbol", type: String, enum: Symbol})
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

    @Get("bonus/list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список реферальных вознаграждений", description: ""})
    @ApiResponse({status: 201, type: ListBonusTokenResponse})
    @UseGuards(RateLimiterGuard)
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
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Покупка токена или индекса", description: ""})
    @ApiResponse({status: 201, type: SwapTokenResponse})
    async swap(@Request() req: RequestModel, @Body() dto: SwapTokenDto): Promise<SwapTokenResponse> {
        const {user, operations} = await this.tokenService.swap(req.userId, dto)
        return {user, operations}
    }

}
