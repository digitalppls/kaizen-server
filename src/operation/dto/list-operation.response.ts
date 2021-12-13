import {ApiProperty} from "@nestjs/swagger";
import {Operation} from "../operation.schema";



export class ListOperationResponse {
  @ApiProperty({description:"Массив операций", type:[Operation]})
  operations: Operation[];

  @ApiProperty({description:"Отсутуп", type:Number})
  offset: number;

  @ApiProperty({description:"Лимит", type:Number})
  limit: number;

  @ApiProperty({description:"Всего найдено по такому запросу", type:Number})
  length: number;
}
