import {ApiProperty} from "@nestjs/swagger";
import {Operation} from "src/operation/operation.schema";
import {UserProduct} from "src/product/user-product.schema";
import {User} from "src/user/user.schema";

export class BuyProductResponse {
  @ApiProperty({type: User, description: "Объект пользователя"})
  user: User


  @ApiProperty({type: UserProduct, description: "Объект продукта пользователя"})
  userProduct: UserProduct


  @ApiProperty({type: [Operation], description: "Операции"})
  operations: Operation[]

}
