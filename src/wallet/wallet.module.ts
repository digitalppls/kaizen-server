import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MongooseModule } from "@nestjs/mongoose";
import { Wallet, WalletSchema } from "./wallet.schema";
import { CurrencyModule } from "../currency/currency.module";

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      { name: Wallet.name, useFactory: () => WalletSchema }
    ], "cloudDB"),
    CurrencyModule
  ],
  providers: [WalletService],
  controllers: [],
  exports:[WalletService]
})
export class WalletModule {}
