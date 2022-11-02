import {Module} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {LimitOrderController} from './limit-order.controller';
import {LimitOrder, LimitOrderSchema} from "src/token/limit-order/limit-order.schema";
import {LimitOrderService} from "src/token/limit-order/limit-order.service";
import {UserModule} from "src/user/user.module";

@Module({
    imports: [
        UserModule,
        MongooseModule.forFeatureAsync([
            {name: LimitOrder.name, useFactory: () => LimitOrderSchema}
        ], "cloudDB")
    ],
    providers: [LimitOrderService],
    exports: [LimitOrderService],
    controllers: [LimitOrderController]
})
export class LimitOrderModule {
}
