import {ApiProperty} from "@nestjs/swagger";
import {BonusPackage} from "src/package/bonus-package.schema";

export class ListBonusPackageResponse {
  @ApiProperty({type: [BonusPackage], description: "Линии бонусов"})
  list: BonusPackage[]
}
