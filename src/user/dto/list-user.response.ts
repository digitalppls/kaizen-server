import {ApiProperty} from "@nestjs/swagger";
import {User} from "../user.schema";
import {AggregateSum} from "src/operation/operation.schema";


export class ListUserResponse {
  @ApiProperty({description:"Массив операций", type:[User]})
  users: User[];

  @ApiProperty({description:"Отсутуп", type:Number})
  offset: number;

  @ApiProperty({description:"Лимит", type:Number})
  limit: number;

  @ApiProperty({description:"Всего найдено по такому запросу", type:Number})
  length: number;
}
