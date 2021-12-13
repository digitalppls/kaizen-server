import {ApiProperty} from "@nestjs/swagger";
import {User} from "src/user/user.schema";
import {AggregateSum} from "src/operation/operation.schema";

export class ListRefResponse {
  @ApiProperty({type: [User], description: "Список рефералов"})
  users: User[];

  @ApiProperty({type: [AggregateSum], description: "Список сумм покупок"})
  aggregateSums:AggregateSum[]
}
