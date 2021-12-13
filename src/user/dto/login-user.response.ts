import { User } from "../user.schema";
import {ApiProperty} from "@nestjs/swagger";

export class LoginUserResponse {
  @ApiProperty({type: String, description: "Токен доступа"})
  access_token: string;
  @ApiProperty({type: String, description: "тип токена"})
  token_type: string;
  @ApiProperty({type: Number, description: "Время сессии"})
  expires_in: number;
  @ApiProperty({type: User, description: "Объект пользователя"})
  user: User
}
