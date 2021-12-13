import {IsMongoId, IsNumber, IsOptional, IsPositive} from "class-validator";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";


export class LineRefDto {


    @IsOptional()
    @IsMongoId()
    @ApiPropertyOptional({name: "_id", type: String, description: "_id пользователя | По умлочанию текущий пользователь"})
    readonly _id: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @ApiPropertyOptional({name: "line", type: Number, description: "Глубина его структуры | По умочанию 1"})
    readonly line: number
}
