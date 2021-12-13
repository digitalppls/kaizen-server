import {ApiProperty} from "@nestjs/swagger";
import {UserPackage} from "src/package/user-package.schema";
import {User} from "src/user/user.schema";

export class WithdrawPackageResponse {
  @ApiProperty({type: UserPackage, description: "Обновленный пользовательский инвестиционный пакет"})
  userPackage: UserPackage

  @ApiProperty({type: User, description: "Обновленный пользователь"})
  user: User
}
