import { User } from "../user.schema";
import {ApiProperty} from "@nestjs/swagger";

export class InfoRefResponse {
  @ApiProperty({type: Number, description: "Сумма бонусов за все время в $"})
  sumUsd: number
}
