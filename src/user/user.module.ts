import {CACHE_MANAGER, Module} from "@nestjs/common";
import {UserService} from "./user.service";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "./user.schema";
import {WalletModule} from "../wallet/wallet.module";
import {OperationModule} from "../operation/operation.module";
import {UserController} from "./user.controller";
import {SocketModule} from "src/socket/socket.module";
import {AuthModule} from "src/auth/auth.module";
import {EmailModule} from "src/email/email.module";
import {StatusModule} from "src/status/status.module";
import {UserWalletController} from "src/user/user-wallet.controller";

@Module({
    imports: [
        AuthModule,
        SocketModule,
        WalletModule,
        OperationModule,
        StatusModule,
        EmailModule,
        MongooseModule.forFeatureAsync([
            {name: User.name, useFactory: () => UserSchema}
        ], "cloudDB")
    ],
    providers: [UserService],
    controllers: [UserController, UserWalletController],
    exports: [UserService]
})
export class UserModule {
}
