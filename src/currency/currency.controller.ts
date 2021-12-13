import {CacheTTL, Controller, Get, HttpException, HttpStatus, Query} from '@nestjs/common';
import {CurrencyService} from "src/currency/currency.service";
import {Currency} from "src/currency/currency.schema";
import {Throttle} from "@nestjs/throttler";
import {ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiResponse, ApiTags} from "@nestjs/swagger";
import {IsInt, IsOptional, IsPositive} from "class-validator";
import {Exceptions} from "src/enums/exceptions.enum";

@ApiTags("Currency")
@Controller('currency')
export class CurrencyController {

    constructor(
        private readonly currencyService:CurrencyService
    ) {
    }

    @ApiOperation({description: "Получение курсов валют"})
    @Get("get")
    @Throttle(100, 10)
    @ApiResponse({type: [Currency]})
    currencyGet(): Currency[] {
        return CurrencyService.getCurrency()
    }


    @ApiQuery({type:Number, required:false, name:"fromTimestamp", description:"С какой даты. По умолчанию сутки назад"})
    @ApiQuery({type:Number, required:false,name:"toTimestamp", description:"По какую дату. По умолчанию - текущая"})
    @ApiQuery({type:String, name:"symbol",  description:"Символ пары, например BTCUSDT"})
    @ApiOperation({description: "Получение истории курса валюты"})
    @Get("history")
    @Throttle(100, 10)
    @ApiResponse({type: [Currency]})
    async currencyHistory(
        @Query("fromTimestamp") fromTimestamp,
        @Query("toTimestamp") toTimestamp,
        @Query("symbol") symbol,
    ): Promise<Currency[]> {
        let _fromTimestamp = Number(fromTimestamp);
        if(_fromTimestamp< 1000000000000) _fromTimestamp * 1000;
        let _toTimestamp = Number(toTimestamp);
        if(_toTimestamp< 1000000000000) _toTimestamp * 1000;
        if(!symbol) throw new HttpException(Exceptions.CURRENCY_ERROR, HttpStatus.BAD_REQUEST)
        const _symbol = symbol.substr(0,20);
        if(Math.abs(_toTimestamp-_fromTimestamp) > 63072000000) throw new HttpException(Exceptions.TOO_LARGE_INTERVAL, HttpStatus.BAD_REQUEST)

        if(!_fromTimestamp)_fromTimestamp=new Date().getTime()-1000*60*60*24 ;
        if(!_toTimestamp)_toTimestamp=new Date().getTime();
        return this.currencyService.getHistory(_fromTimestamp,_toTimestamp,_symbol)
    }




    @ApiQuery({type:String, name:"symbols",  description:"Символы , например BTCUSDT,ETHUSDT"})
    @ApiOperation({description: "Получение market cap  валют"})
    @Get("cap")
    @Throttle(100, 10)
    // @ApiResponse({type: [Currency]})
        async marketCap(   @Query("symbols") symbols:string,
    ): Promise<any[]> {
        if(!symbols || symbols.length<2) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.BAD_REQUEST)
        const arr=[
            {symbol:"KAIZENUSDT", value:822000000},
            {symbol:"COIN10USDT", value:12400000},
            {symbol:"DEFIUSDT", value:52412332},
            {symbol:"CRYPTO100USDT", value:85345322}
        ]
        const names = symbols.split(",").map(x=>x.toLowerCase().replace(" ",""));
        return arr.filter(x=>names.includes(x.symbol.toLowerCase()));
    }
}
