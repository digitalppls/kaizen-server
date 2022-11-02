import {CacheModule, Module} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import {MongooseModule} from "@nestjs/mongoose";
import {Wallet, WalletSchema} from "src/wallet/wallet.schema";
import {Currency, CurrencySchema} from "src/currency/currency.schema";

@Module({
  imports:[
    CacheModule.register({ttl:5}),
    MongooseModule.forFeatureAsync([
    { name: Currency.name, useFactory: () => CurrencySchema }
  ], "cloudDB")],
  providers: [CurrencyService],
  exports:[CurrencyService],
  controllers: [CurrencyController]
})
export class CurrencyModule {}
