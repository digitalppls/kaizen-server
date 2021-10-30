import {ApiProperty} from "@nestjs/swagger";
import {Pair} from "src/pancake/schemas/pair.schema";



export class GetPairResponse {
  @ApiProperty({description:"Пара", type: Pair})
  pair: Pair;

}
