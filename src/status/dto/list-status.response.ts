import {ApiProperty} from "@nestjs/swagger";
import {Status} from "src/status/status.schema";



export class ListStatusResponse {
  @ApiProperty({description:"Массив статусов", type:[Status]})
  statuses: Status[];
}
