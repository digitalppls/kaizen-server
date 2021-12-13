import {Injectable} from '@nestjs/common';
import {Cron, CronExpression, Interval} from "@nestjs/schedule";
import {Currency, CurrencyDocument, Symbol} from "src/currency/currency.schema";
import axios from "axios";
import {ConfigService} from "@nestjs/config";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {SaleToken} from "src/token/sale-token.schema";


export let list: Currency[] = [];

@Injectable()
export class CurrencyService {

    constructor(
        private configService: ConfigService,
        @InjectModel(Currency.name) private currencyModel: Model<CurrencyDocument>,
    ) {
        this.LoadExternalTokens().then();
        this.parsePrices().then();
    }

    @Interval(20000)
    async LoadExternalTokens() {
        const date = new Date();
        const response = await axios.get(this.configService.get("WALLET33_URL") + "/crypto/prices");
        if (response && response.data && response.data.length > 0) {
            this.push(...response.data, {symbol: "USDTUSDT", price: 1, date}, {
                symbol: "USDUSDT",
                price: 1, date
            }, {symbol: "USDCUSDT", price: 1, date}, {symbol: "BUSDUSDT", price: 1, date});
        }
       }


    /* From SaleTokenService */
    async SaveInternalTokensPrices(sales:SaleToken[]){
        const date = new Date();
        for(let sale of sales){
            this.push({
                date,
                symbol: sale.symbol.toUpperCase()+"USDT",
                price: sale.priceUsd
            });
        }
    }


    push(...currencies: Currency[]) {
        for (let currency of currencies) {
            const find: Currency = list.find(x => x.symbol === currency.symbol);
            if (find) {
                find.price = Number(currency.price);
                find.index = !!currency.index;
                find.date=currency.date;
            } else list.push({
                symbol: currency.symbol,
                price: Number(currency.price),
                index: !!currency.index,
                date: new Date()
            })
        }
    }

    @Interval(10000)
    async parsePrices() {
        axios({
            method: 'get',
            url: 'https://marketdata.avaapiweb.com/api/MarketData/GetChartPoints?symbol=CRYPTO10&interval=m1&points=1',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Referer': 'https://www.avatrade.com/',
                'Content-Type': 'application/json; charset=utf-8',
                'Origin': 'https://www.avatrade.com',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'TE': 'trailers'
            }
        }).then(response => {
            const symbol = Symbol.CRYPTO10.toUpperCase() + "USDT";
            const price: number = Number(response.data[0][1]);
            if (price) this.push({symbol, price, index: true, date: new Date()})
        })
            .catch(function (error) {
                console.log(error);
            });


        axios({
            url: "https://nomics.com/data/currencies-ticker?filter=any&include-transparency=true&interval=1h,1d,7d,30d,365d,ytd&quote-currency=USD&symbols=DEFI2",
            method: "POST",
            "headers": {
                "credentials": "include",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0",
                "Accept": "*/*",
                "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "referrer": "https://nomics.com/assets/defi2-defi-composite-index",
                "method": "GET",
                "mode": "cors"
            },
        }).then(response => {
            const symbol = Symbol.DEFI.toUpperCase() + "USDT";
            const price: number = Number(response.data.items.find(x => x.symbol.toLowerCase() === 'defi').price);
            if (price) this.push({symbol, price, index: true, date: new Date()})
        }).catch(function (error) {
            console.log(error);
        });

        axios({
            url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ECIX100?useYfid=true&interval=1d'
        }).then(response => {
            const symbol = Symbol.CIX100.toUpperCase() + "USDT";
            const price: number = Number(response.data.chart.result[0].meta.regularMarketPrice);
            if (price) this.push({symbol, price, index: true, date: new Date()})
        })

        axios({
            url: 'https://query1.finance.yahoo.com/v8/finance/chart/BITW?useYfid=true&interval=1d'
        }).then(response => {
            const symbol = Symbol.BITW.toUpperCase() + "USDT";
            const price: number = Number(response.data.chart.result[0].meta.regularMarketPrice);
            if (price) this.push({symbol, price, index: true, date: new Date()})
        })
    }

    static getCurrency(): Currency[] {
        return list;
    }

    static toUsd(symbol: Symbol, amount: number): number {
        const coin = list.find(x => x.symbol === symbol.toUpperCase() + "USDT");
        const usd = symbol.toUpperCase() === "USDT" ? amount : !coin ? 0 : (coin.price * amount);
        return Math.round(usd * 1e8) / 1e8;
    }

    @Cron(CronExpression.EVERY_3_HOURS)
    saveCurrencies() {
        this.currencyModel.insertMany(list).then()
    }

    static fromUsd(symbol: Symbol, amountUsd: number): number {
        const coin = list.find(x => x.symbol === symbol.toUpperCase() + "USDT");
        const usd = symbol.toUpperCase() === "USDT" ? amountUsd : !coin ? 0 : (amountUsd / coin.price);
        return Math.round(usd * 1e8) / 1e8
    }

    static fromTo(fromSymbol: Symbol, toSymbol: Symbol, fromAmount: number): number {
        const usd = this.toUsd(fromSymbol, fromAmount);
        const toAmount = this.fromUsd(toSymbol, usd);
        return toAmount;
    }

    async getHistory(fromTimestamp: number, toTimestamp: number, symbol: string):Promise<Currency[]> {
        const filter = {date:{$lte:new Date(toTimestamp), $gte:new Date(fromTimestamp)},symbol};
        console.log(filter)
       return this.currencyModel.find(filter)
    }
}
