import {Module} from '@nestjs/common';
import {ProductService} from "./product.service";
import {ProductController} from "./product.controller";
import {MongooseModule} from "@nestjs/mongoose";
import {Product, ProductSchema} from "./product.schema";
import {EmailModule} from "src/email/email.module";
import {ApplyProduct, ApplyProductSchema} from "src/product/apply-product.schema";
import {BonusProduct, BonusProductSchema} from "src/product/bonus-product.schema";
import {UserProduct, UserProductSchema} from "src/product/user-product.schema";
import {BonusProductService} from "src/product/bonus-product.service";
import {UserProductService} from "src/product/user-product.service";
import {UserModule} from "src/user/user.module";

@Module({
    imports: [
        EmailModule,
        UserModule,
        MongooseModule.forFeatureAsync([
            {name: Product.name, useFactory: () => ProductSchema},
            {name: ApplyProduct.name, useFactory: () => ApplyProductSchema},
            {name: BonusProduct.name, useFactory: () => BonusProductSchema},
            {name: UserProduct.name, useFactory: () => UserProductSchema},
        ], "cloudDB")
    ],
    providers: [ProductService, BonusProductService, UserProductService],
    controllers: [ProductController],
    exports: [ProductService, UserProductService, BonusProductService]
})
export class ProductModule {
}
