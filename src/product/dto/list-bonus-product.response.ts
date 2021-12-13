import {ApiProperty} from "@nestjs/swagger";
import {BonusProduct} from "src/product/bonus-product.schema";

export class ListBonusProductResponse {
  @ApiProperty({type: [BonusProduct], description: "Линии бонусов"})
  list: BonusProduct[]
}
