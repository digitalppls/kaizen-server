import {CacheInterceptor, CacheModule, MiddlewareConsumer, Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {EventEmitterModule} from "@nestjs/event-emitter";

import {ScheduleModule} from "@nestjs/schedule";
import {ServeStaticModule} from "@nestjs/serve-static";
import {join} from "path";
import {WalletModule} from './wallet/wallet.module';
import {CurrencyModule} from "./currency/currency.module";
import {ThrottlerModule} from "@nestjs/throttler";
import {JwtStrategy} from "./auth/jwt.strategy";
import {SocketModule} from "./socket/socket.module";
import {UserModule} from "./user/user.module";
import {AuthModule} from "./auth/auth.module";
import {EmailModule} from 'src/email/email.module';
import {AuthMiddleware} from "src/auth/auth.middleware";
import {PackageModule} from './package/package.module';
import {TokenModule} from './token/token.module';
import {RefModule} from './ref/ref.module';
import {ProductModule} from "src/product/product.module";

@Module({
    imports: [

        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot({ttl: JwtStrategy.ttl, limit: JwtStrategy.ttl_limit}),
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({isGlobal: true}),
        ServeStaticModule.forRoot({serveRoot: '/api/public', rootPath: join(__dirname, "../", "public")}),

        // База в облоке для хранения важных данных
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: "cloudDB",
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>("MONGODB_URL"),
                useFindAndModify: false
            }),
            inject: [ConfigService]
        }),


        WalletModule,
        CurrencyModule,
        AuthModule,
        UserModule,
        SocketModule,
        EmailModule,
        PackageModule,
        ProductModule,
        TokenModule,
        RefModule
    ],
    controllers: [],

})

export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware)
            .exclude(
                "/api",
                "/api/bot/callback",
                "/api/package/list",
                "/api/product/list",
                "/api/package/bonus/list",
                "/api/currency/history",
                "/api/currency/get",
                "/api/token/bonus/list",
                "/api/token/swap/list",
                "/api/token/(.*)/sale/list",
                "/api/fund/list",
                "/api/status/list",
                "/api/user/wallet/withdraw/list",
                "/api/user/create",
                "/api/user/login",
                "/api/user/username/get",
                "/api/user/login/detect",
                "/api/user/password/recovery",
                "/api/user/password/recovery/set",
                "/api/user/email/verify/check",
                "/api/user/wallet/callback",
                "/api/product/apply",
                "/api/cryptowallet/supported",
                "/api/product/bonus/list",
                "/api/public/sdk.ts",
                "/api/public/scheme.json",
            )
            .forRoutes("")
    }
}
