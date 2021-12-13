import {ApiProperty} from "@nestjs/swagger";
import {UserPackage} from "src/package/user-package.schema";

export class ListUserPackageResponse {
  @ApiProperty({type: [UserPackage], description: "Пользовательские инвестиционные пакеты"})
  list: UserPackage[]
}
