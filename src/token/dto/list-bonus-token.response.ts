import {ApiProperty} from "@nestjs/swagger";
import {BonusToken} from "src/token/bonus-token.schema";

export class ListBonusTokenResponse {
    @ApiProperty({type: [BonusToken], description: "Линии бонусов"})
    list: BonusToken[]
}
