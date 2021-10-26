import {ApiProperty} from "@nestjs/swagger";
import {Operation} from "src/operation/operation.schema";
import {User} from "src/user/user.schema";

export class SwapTokenResponse {
  @ApiProperty({type: User, description: "Объект пользователя"})
  user: User


  @ApiProperty({type: [Operation], description: "Операции"})
  operations: Operation[]

}
