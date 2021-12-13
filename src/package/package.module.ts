import {Module} from '@nestjs/common';
import {PackageService} from './package.service';
import {PackageController} from './package.controller';
import {MongooseModule} from "@nestjs/mongoose";
import {Package, PackageSchema} from "src/package/package.schema";
import {UserModule} from "src/user/user.module";
import {UserPackage, UserPackageSchema} from "src/package/user-package.schema";
import {OperationModule} from "src/operation/operation.module";
import {BonusPackage, BonusPackageSchema} from "src/package/bonus-package.schema";
import {BonusPackageService} from "src/package/bonus-package.service";
import {StatusModule} from "src/status/status.module";

@Module({

    imports: [
        UserModule,
        OperationModule,
        StatusModule,
        MongooseModule.forFeatureAsync([
            {name: Package.name, useFactory: () => PackageSchema},
            {name: UserPackage.name, useFactory: () => UserPackageSchema},
            {name: BonusPackage.name, useFactory: () => BonusPackageSchema}
        ], "cloudDB")
    ],
    providers: [PackageService, BonusPackageService],
    controllers: [PackageController]
})
export class PackageModule {
}
