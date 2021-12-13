import {
    IsMongoId,
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class BuyProductDto {

    @ApiProperty({type: String, required: true, description: "_id продукта"})
    @IsMongoId()
    readonly productId: string;

}
