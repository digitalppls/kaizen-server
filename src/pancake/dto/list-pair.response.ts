import {ApiProperty} from "@nestjs/swagger";
import {Pair} from "src/pancake/schemas/pair.schema";



export class ListPairResponse {
  @ApiProperty({description:"Массив Пар", type:[Pair]})
  pairs: Pair[];

  @ApiProperty({description:"Отсутуп", type:Number})
  offset: number;

  @ApiProperty({description:"Лимит", type:Number})
  limit: number;

  @ApiProperty({description:"Всего найдено по такому запросу", type:Number})
  length: number;
}
