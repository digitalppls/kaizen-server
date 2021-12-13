import {ApiProperty} from "@nestjs/swagger";
import {SaleToken} from "src/token/sale-token.schema";

export class ListSaleTokenResponse {
    @ApiProperty({type: [SaleToken], description: "Линии сейлов"})
    list: SaleToken[]
}
