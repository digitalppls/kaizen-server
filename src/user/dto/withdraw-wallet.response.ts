import { User } from "../user.schema";
import {ApiProperty} from "@nestjs/swagger";
import {Operation} from "../../operation/operation.schema";

export class WithdrawWalletResponse {
  @ApiProperty({type: User, description: "Объект пользователя"})
  user: User


  @ApiProperty({type: Operation, description: "Объект операции"})
  operation: Operation
}
