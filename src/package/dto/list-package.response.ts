import {ApiProperty} from "@nestjs/swagger";
import {Package} from "src/package/package.schema";

export class ListPackageResponse {
  @ApiProperty({type: [Package], description: "Инвестиционные пакеты"})
  list: Package[]
}
