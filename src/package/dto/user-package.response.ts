import {ApiProperty} from "@nestjs/swagger";
import {UserPackage} from "src/package/user-package.schema";
import {Operation} from "src/operation/operation.schema";

export class UserPackageResponse {
    @ApiProperty({type: UserPackage, description: "Пользовательский инвестиционный пакет"})
    userPackage: UserPackage

    @ApiProperty({type: [Operation], description: "Список проделанных операций"})
    operations:Operation[];
}
