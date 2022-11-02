import {Body, Controller, Get, Post, Request} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {RequestModel} from "src/auth/auth.middleware";
import {ProductService} from "src/product/product.service";
import {ListProductResponse} from "src/product/dto/list-product.response";
import {ListProductDto} from "src/product/dto/list-product.dto";
import {Throttle} from "@nestjs/throttler";
import {ApplyProduct} from "src/product/apply-product.schema";
import {EmailService} from "src/email/email.service";
import {UserProductService} from "src/product/user-product.service";
import {ListUserProductDto} from "src/product/dto/list-user-product.dto";
import {ListUserProductResponse} from "src/product/dto/list-user-product.response";
import {BuyProductResponse} from "src/product/dto/buy-product.response";
import {BuyProductDto} from "src/product/dto/buy-product.dto";
import {Types} from "mongoose";
import {ListBonusProductResponse} from "src/product/dto/list-bonus-product.response";
import {BonusProduct} from "src/product/bonus-product.schema";
import {BonusProductService} from "src/product/bonus-product.service";
import {Product} from "src/product/product.schema";


@ApiTags("📦 Продукты")
@Controller('product')
export class ProductController {

    constructor(
        private readonly emailService: EmailService,
        private readonly productService: ProductService,
        private readonly userProductService: UserProductService,
        private readonly bonusProductService: BonusProductService,
    ) {
    }


    @Post("list")
    @ApiOperation({summary: "Получение списка продуктов", description: ""})
    @ApiBody({type: ListProductDto})
    @ApiResponse({status: 201, type: ListProductResponse})
    async listPost(@Request() req: RequestModel, @Body() dto: ListProductDto): Promise<ListProductResponse> {
        return this.productService.list(dto);
    }


    @Post("list/my")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Получение списка продуктов приобретенных пользователем", description: ""})
    @ApiBody({type: ListUserProductDto})
    @ApiResponse({status: 201, type: ListUserProductResponse})
    async productList(@Request() req: RequestModel, @Body() dto: ListUserProductDto): Promise<ListUserProductResponse> {
        return this.userProductService.list(req.userId, dto);
    }


    @Post("buy")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Покупка продукта", description: ""})
    @ApiResponse({status: 201, type: BuyProductResponse})
    async buyProduct(@Request() req: RequestModel, @Body() buyProductDto: BuyProductDto): Promise<BuyProductResponse> {
        return await this.userProductService.buy(req.userId, Types.ObjectId(buyProductDto.productId));
    }


    @Throttle(1, 60)
    @Post("apply")
    @ApiBody({type: ApplyProduct})
    @ApiOperation({summary: "Новая заявка на продукт", description: "Лимит запросов 1 в 60 секунд с 1 IP"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async apply(@Body() dto: ApplyProduct): Promise<boolean> {
        dto.term = dto.term + '';
        await this.emailService.sendApply(dto)
        return this.productService.apply(dto);
    }


    @Get("bonus/list")
    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiOperation({summary: "Список реферальных вознаграждений", description: ""})
    @ApiResponse({status: 201, type: ListBonusProductResponse})
    @Throttle(2, 5)
    async refBonusList(): Promise<ListBonusProductResponse> {
        const list = await this.bonusProductService.bonusList();
        return {list}
    }


    @Post("bonus/save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение реферальных бонусов",
        description: "Добавление линии реферальных вознаграждений / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @ApiResponse({status: 201, type: ListBonusProductResponse})
    async statusAdd(@Body() refBonus: BonusProduct): Promise<ListBonusProductResponse> {
        await this.bonusProductService.save(refBonus);
        const list = await this.bonusProductService.bonusList();
        return {list}
    }


    @Post("save")
    @ApiBearerAuth()
    @ApiBody({type:Product})
    @ApiConsumes( 'application/json','application/x-www-form-urlencoded')
    @ApiOperation({
        summary: "Добавление/удаление/изменение",
        description: " если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @ApiResponse({status: 201, type: ListProductResponse})
    async save(@Body() p: Product): Promise<ListProductResponse> {
        await this.productService.save(p);
        const products = await this.productService.list({offset:0,limit:20});
        return products;
    }



}
