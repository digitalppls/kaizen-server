import {ApiProperty} from "@nestjs/swagger";
import {Product} from "../product.schema";



export class ListProductResponse {
  @ApiProperty({description:"Массив операций", type:[Product]})
  products: Product[];

  @ApiProperty({description:"Отсутуп", type:Number})
  offset: number;

  @ApiProperty({description:"Лимит", type:Number})
  limit: number;

  @ApiProperty({description:"Всего найдено по такому запросу", type:Number})
  length: number;
}
