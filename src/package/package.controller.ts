import {Body, CacheTTL, Controller, Get, HttpException, HttpStatus, Post, Request} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {Throttle} from "@nestjs/throttler";
import {PackageService} from "./package.service";
import {Package} from "./package.schema";
import {ListPackageResponse} from "src/package/dto/list-package.response";
import {UserPackageResponse} from "src/package/dto/user-package.response";
import {BuyPackageDto} from "src/package/dto/buy-package.dto";
import {RequestModel} from "src/auth/auth.middleware";
import {ListUserPackageResponse} from "src/package/dto/list-user-package.response";
import {WithdrawPackageDto} from "src/package/dto/withdraw-package.dto";
import {WithdrawPackageResponse} from "src/package/dto/withdraw-package.response";
import {Symbol} from "src/currency/currency.schema";
import {Exceptions} from "src/enums/exceptions.enum";
import {ListBonusPackageResponse} from "src/package/dto/list-bonus-package.response";
import {BonusPackage} from "src/package/bonus-package.schema";
import {BonusPackageService} from "src/package/bonus-package.service";

@ApiTags("Package")
@Controller('package')
export class PackageController {

    constructor(
        private readonly packageService: PackageService,
        private readonly bonusPackageService: BonusPackageService
    ) {
    }

    @Get("list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список инвестиционных пакетов", description: ""})
    @ApiResponse({status: 201, type: ListPackageResponse, description: "Список Пакетов"})
    @Throttle(2, 5)
    @CacheTTL(10)
    async list(): Promise<ListPackageResponse> {
        const list = await this.packageService.list();
        return {list}
    }


    @Post("list/my")
    @ApiBearerAuth()
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список инвестиционных пакетов, купленных пользователем", description: ""})
    @ApiResponse({status: 201, type: ListUserPackageResponse, description: "Список пакетов купленных пользователем"})
    async listMy(@Request() req:RequestModel): Promise<ListUserPackageResponse> {
        const list = await this.packageService.listMy(req.userId);
        return {list}
    }



    @Post("save")
    @ApiBearerAuth()
    @ApiBody({type:Package})
    @ApiConsumes( 'application/json','application/x-www-form-urlencoded')
    @ApiOperation({
        summary: "Добавление/удаление/изменение  инвестиционных пакетов",
        description: "Добавление инвестиционных пакетов  / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @ApiResponse({status: 201, type: ListPackageResponse})
    async statusAdd(@Body() p: Package): Promise<ListPackageResponse> {
        await this.packageService.save(p);
        const list = await this.packageService.list();
        return {list}
    }


    @Post("buy")
    @ApiBearerAuth()
    @ApiBody({type:BuyPackageDto})
    @ApiConsumes( 'application/json','application/x-www-form-urlencoded')
    @ApiOperation({summary: "Покупка пакета",})
    @ApiResponse({status: 201, type: UserPackageResponse})
    async buy(@Request() req:RequestModel, @Body() dto: BuyPackageDto): Promise<UserPackageResponse> {
        return this.packageService.buy(req.userId, dto);
    }

    @Post("withdraw")
    @ApiBearerAuth()
    @ApiBody({type:WithdrawPackageDto})
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Вывод накопленных средств с инвестиционного пакета на счет пользователя", description: ""})
    @ApiResponse({status: 201, type: WithdrawPackageResponse})
    async withdraw(@Request() req:RequestModel, @Body() dto:WithdrawPackageDto): Promise<WithdrawPackageResponse> {
        return this.packageService.withdraw(req.userId, dto);
    }



    //---

    @Get("bonus/list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список линейных бонусов", description: ""})
    @ApiResponse({status: 201, type: ListBonusPackageResponse, description: "Список линейных бонусов по линиям"})
    @Throttle(2, 5)
    @CacheTTL(10)
    async bonusList(): Promise<ListBonusPackageResponse> {
        const list = await this.bonusPackageService.list();
        return {list}
    }


    @Post("bonus/save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение линейных бонусов",
        description: "Добавление линии линейных вознаграждений / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @ApiResponse({status: 201, type: ListBonusPackageResponse})
    async bonusSave(@Body() linearBonus: BonusPackage): Promise<ListBonusPackageResponse> {
        await this.bonusPackageService.save(linearBonus);
        const list = await this.bonusPackageService.list();
        return {list}
    }

}
