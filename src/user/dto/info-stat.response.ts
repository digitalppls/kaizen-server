import { User } from "../user.schema";
import {ApiProperty} from "@nestjs/swagger";

export class InfoStatResponse {
  @ApiProperty({type: Number, description: "Инвестировано собственноручно"})
  self_invest_usd: number;

  @ApiProperty({type: Number, description: "Инвестировано партнерами в 1 линии"})
  first_line_invest_usd: number;

  @ApiProperty({type: Number, description: "Инвестировано всеми партнерами "})
  structure_invest_usd: number;
}
