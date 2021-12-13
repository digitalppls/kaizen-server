import {ApiProperty} from "@nestjs/swagger";
import {UserProduct} from "src/product/user-product.schema";



export class ListUserProductResponse {
  @ApiProperty({description:"Массив операций", type:[UserProduct]})
  products: UserProduct[];

  @ApiProperty({description:"Отсутуп", type:Number})
  offset: number;

  @ApiProperty({description:"Лимит", type:Number})
  limit: number;

  @ApiProperty({description:"Всего найдено по такому запросу", type:Number})
  length: number;
}
