import { User } from "../user.schema";
import {ApiProperty} from "@nestjs/swagger";

export class GetUserResponse {
  @ApiProperty({type: User, description: "Объект пользователя"})
  user: User
}
