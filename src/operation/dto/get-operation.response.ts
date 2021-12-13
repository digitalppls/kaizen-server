import {ApiProperty} from "@nestjs/swagger";
import {Operation} from "../operation.schema";



export class GetOperationResponse {
  @ApiProperty({description:"Операция", type: Operation})
  operation: Operation;

}
