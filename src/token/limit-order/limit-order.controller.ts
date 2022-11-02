import {Body, Controller, Get, HttpException, HttpStatus, Post, Req} from '@nestjs/common';
import {ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {Throttle} from "@nestjs/throttler";
import {LimitOrderService} from "src/token/limit-order/limit-order.service";
import {LimitOrder, LimitOrderDirection} from "src/token/limit-order/limit-order.schema";
import {Exceptions} from "src/enums/exceptions.enum";
import {RequestModel} from "src/auth/auth.middleware";

@ApiTags("🪙 Токены 🚧️ Лимитированные ордера")
@Controller('token/limit-order')
export class LimitOrderController {

    constructor(
        private readonly limitOrderService: LimitOrderService) {
    }

    @Get("list")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Получение списка", description: ""})
    @Throttle(2, 5)
    @ApiResponse({status: 201, type: [LimitOrder]})
    async list(@Req() request:RequestModel): Promise<LimitOrder[]> {
        return this.limitOrderService.list(request.userId);
    }

    
    // @ApiTags("👨🏻‍💼 Админ")
    @Get("list/all")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Получение списка всех заявок всех пользователей", description: ""})
    @Throttle(2, 5)
    @ApiResponse({status: 201, type: [LimitOrder]})
    async listAll(@Req() request:RequestModel): Promise<LimitOrder[]> {
        return this.limitOrderService.list();
    }

    @Post("sell/save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение ордера на продажу",
        description: "Добавление нового статуса в список / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @Throttle(2, 5)
    @ApiResponse({status: 201, type: [LimitOrder]})
    async sellSave(@Req() request:RequestModel, @Body() limitOrder: LimitOrder): Promise<LimitOrder[]> {
        if(limitOrder.direction && limitOrder.direction!==LimitOrderDirection.SELL) throw new HttpException(Exceptions.INCORRECT_TYPE, HttpStatus.NOT_ACCEPTABLE)
        await this.limitOrderService.save(request.userId, limitOrder);
        return this.limitOrderService.list(request.userId);
    }



    @ApiTags("👨🏻‍💼 Админ")
    @Post("buy/save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение ордера на покупку (👨🏻‍💼)",
        description: "Добавление нового статуса в список / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @Throttle(2, 5)
    @ApiResponse({status: 201, type: [LimitOrder]})
    async buySave(@Req() request:RequestModel, @Body() limitOrder: LimitOrder): Promise<LimitOrder[]> {
        if(limitOrder.direction && limitOrder.direction!==LimitOrderDirection.BUY) throw new HttpException(Exceptions.INCORRECT_TYPE, HttpStatus.NOT_ACCEPTABLE)
        await this.limitOrderService.save(request.userId, limitOrder);
        return this.limitOrderService.list(request.userId);
    }


}
