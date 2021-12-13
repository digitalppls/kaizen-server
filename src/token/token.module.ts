import {Module} from '@nestjs/common';
import {TokenService} from './token.service';
import {TokenController} from './token.controller';
import {UserModule} from "src/user/user.module";
import {BonusTokenService} from "src/token/bonus-token.service";
import {MongooseModule} from "@nestjs/mongoose";
import {BonusToken, BonusTokenSchema} from "src/token/bonus-token.schema";
import {SaleToken, SaleTokenSchema} from "src/token/sale-token.schema";
import {SaleTokenService} from "src/token/sale-token.service";
import {CurrencyModule} from "src/currency/currency.module";


@Module({
    imports: [
        CurrencyModule,
        UserModule,
        MongooseModule.forFeatureAsync([
            {name: BonusToken.name, useFactory: () => BonusTokenSchema},
            {name: SaleToken.name, useFactory: () => SaleTokenSchema},
        ], "cloudDB")
    ],
    providers: [TokenService, SaleTokenService, BonusTokenService],
    controllers: [TokenController]
})
export class TokenModule {
}
