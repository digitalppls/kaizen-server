import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Model, Types} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";
import {UserProduct, UserProductDocument} from "src/product/user-product.schema";
import {ListUserProductResponse} from "./dto/list-user-product.response";
import {ListUserProductDto} from "./dto/list-user-product.dto";
import {Product} from "src/product/product.schema";
import {CurrencyService} from "src/currency/currency.service";
import {OperationType} from "src/operation/operation.schema";
import {Symbol} from "src/currency/currency.schema"
import {Exceptions} from "src/enums/exceptions.enum";
import {ProductService} from "src/product/product.service";
import {BonusProduct} from "src/product/bonus-product.schema";
import {UserService} from "src/user/user.service";
import {BonusProductService} from "src/product/bonus-product.service";
import {BuyProductResponse} from "src/product/dto/buy-product.response";

@Injectable()
export class UserProductService {

    constructor(
        private readonly userService:UserService,
        private readonly productService:ProductService,
        private readonly bonusProductService:BonusProductService,
        @InjectModel(UserProduct.name) private userProductModel: Model<UserProductDocument>

    ) {
    }

    async list(user: Types.ObjectId, dto:ListUserProductDto):Promise<ListUserProductResponse> {
        const filter:any = { user };
        const length = await this.userProductModel.countDocuments(filter)
        const products =  await this.userProductModel.find(filter).sort({date:-1}).skip(dto.offset).limit(dto.limit).populate("product");
        return {length, offset:dto.offset, limit:dto.limit, products}

    }


    async productFind(user:Types.ObjectId, product:Types.ObjectId):Promise<UserProduct> {
        return this.userProductModel.findOne({user, product});
    }

    async length(user: Types.ObjectId):Promise<number> {
        return this.userProductModel.countDocuments({user});
    }

    async add(user:Types.ObjectId, product: Product) :Promise<UserProduct>{

        const finded:UserProduct = await this.userProductModel.findOne({product:product._id,user});
        if(finded){
            let dateEnd = new Date(finded.dateEnd);
            if(dateEnd<new Date())dateEnd=new Date();
            dateEnd.setDate(dateEnd.getDate()+product.termDays);
            return this.userProductModel.findOneAndUpdate({
                product: product._id,
                user: user
            }, {$set: {dateEnd}}, {new: true});
        }

        const dateStart = new Date();
        const dateEnd = new Date();
        dateEnd.setDate(dateStart.getDate()+product.termDays);
        return this.userProductModel.create({product:product._id, dateStart,dateEnd, priceUsd:product.priceUsd, user})
    }



    async buy(userId: Types.ObjectId, productId: Types.ObjectId): Promise<BuyProductResponse> {
        const product = await this.productService.get(productId);
        if (!product) throw new HttpException(Exceptions.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

        // const priceFcoin = CurrencyService.fromUsd(Symbol.FCOIN, product.priceUsd);
        const {
            user,
            operations
        } = await this.userService.walletIncrement(userId, Symbol.USDT, -product.priceUsd, OperationType.PRODUCT_BUY, product._id);
        const userProduct = await this.add(userId, product);

        // Ref Bonuses
        const bonusProductList: BonusProduct[] = await this.bonusProductService.bonusList();
        for (let i = 0; i < user.fathers.length && i < bonusProductList.length; i++) {
            const {percent} = bonusProductList[i];
            const fatherId = user.fathers[i]
            for (let o = 0; o < operations.length; o++) {
                const operation = operations[o];
                const updateUser = o === operations.length - 1;
                await this.userService.walletIncrement(fatherId, operation.symbol, Math.abs(operation.amount * percent / 100), OperationType.PRODUCT_REF_BONUS, operation._id, undefined, undefined, user._id, updateUser)
            }
        }
        return {user, userProduct, operations: [/*...tokensAsBonusForBuyProduct.operations,*/ ...operations]}
    }
}
