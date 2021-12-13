import {ApiProperty} from "@nestjs/swagger";
import {IsEnum, IsMongoId, IsNumber, IsPositive, IsString} from "class-validator";
import {Symbol} from "src/currency/currency.schema";

export class BuyPackageDto {
  @ApiProperty({type: String, description: "_id Пакета"})
  @IsMongoId()
  _id: string;

  @ApiProperty({type: Number, description: "Сумма"})
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({type: String, enum:Symbol, description: "Валюта"})
  @IsString()
  @IsEnum(Symbol)
  symbol: Symbol;
}
