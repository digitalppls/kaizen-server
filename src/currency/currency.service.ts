import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression, Interval} from "@nestjs/schedule";
import {Currency, CurrencyDocument, Index, Symbol} from "src/currency/currency.schema";
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

    static getCurrency(): Currency[] {
        return list;
    }

    static toUsd(symbol: Symbol, amount: number): number {
        const coin = list.find(x => x.symbol === symbol.toUpperCase() + "USDT");
        const usd = symbol.toUpperCase() === "USDT" ? amount : !coin ? 0 : (coin.price * amount);
        return Math.round(usd * 1e8) / 1e8;
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

    @Interval(20000)
    async LoadExternalTokens() {
        const date = new Date();
        const response = await axios.get(this.configService.get("WALLET33_URL") + "/crypto/prices");
        if (response && response.data && response.data.length > 0) {
            this.push(...response.data.filter(x => ["BNBUSDT", "BTCUSDT", "TRXUSDT"].includes(x.symbol)),
                {symbol: "USDTUSDT", price: 1, date},
                {symbol: "USDCUSDT", price: 1, date},
                {symbol: "BUSDUSDT", price: 1, date}
            );
        }
    }

    /* From SaleTokenService */
    async SaveInternalTokensPrices(sales: SaleToken[]) {
        const date = new Date();
        for (let sale of sales) {
            this.push({
                date,
                symbol: sale.symbol.toUpperCase() + "USDT",
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
                find.date = currency.date;
            } else list.push({
                symbol: currency.symbol,
                price: Number(currency.price),
                index: !!currency.index,
                date: new Date()
            })
        }
    }

    @Interval(100000)
    async parsePrices() {
        try {
            Promise.all([
                'https://query1.finance.yahoo.com/v8/finance/chart/DEFI.NE?useYfid=true&interval=1d',
                'https://query1.finance.yahoo.com/v8/finance/chart/CRO-USD?useYfid=true&interval=1d',
                'https://query1.finance.yahoo.com/v8/finance/chart/%5ECIX100?useYfid=true&interval=1d',
                'https://query1.finance.yahoo.com/v8/finance/chart/BITW?useYfid=true&interval=1d'
            ].map(url => axios.get(url))).then(responses => {
                for (let i = 0; i < responses.length; i++) {
                    const symbol = [Index.DEFI, Index.CRYPTO10, Index.CIX100, Index.BITW][i].toUpperCase() + "USDT";
                    const price: number = Number(responses[i].data.chart.result[0].meta.regularMarketPrice);
                    if (price) this.push({symbol, price, index: true, date: new Date()})
                }
            })
        }catch (err){
            Logger.error("Не удалось загрузить индексы из yahoo finance", err.message);
        }
    }

    @Cron(CronExpression.EVERY_3_HOURS)
    saveCurrencies() {
        this.currencyModel.insertMany(list).then()
    }

    async getHistory(fromTimestamp: number, toTimestamp: number, symbol: string): Promise<Currency[]> {
        const filter = {date: {$lte: new Date(toTimestamp), $gte: new Date(fromTimestamp)}, symbol};
        console.log(filter)
        return this.currencyModel.find(filter)
    }
}
