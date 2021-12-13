import {ApiProperty} from "@nestjs/swagger";
import {IsMongoId} from "class-validator";

export class WithdrawPackageDto {
    @ApiProperty({type: String, description: "_id пользовательского депозита/пакета из которого нужно вывести"})
    @IsMongoId()
    _id: string;
}
