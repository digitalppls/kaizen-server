import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Model, Types } from "mongoose";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import { Wallet, WalletDocument } from "./wallet.schema";
import { Exceptions } from "../enums/exceptions.enum";
import {CurrencyService} from "src/currency/currency.service";
import {Symbol} from "src/currency/currency.schema";

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private configService:ConfigService) {}

  async create():Promise<{_id:Types.ObjectId, assets:{network:string,address:string}[]}> {
    const config = { headers: { 'apiKey':  this.configService.get("WALLET33_KEY")}}
    const wallet = await axios.post(this.configService.get("WALLET33_URL")+"/wallet/create", {}, config);
    return {_id:Types.ObjectId(wallet.data._id), assets:wallet.data.assets};
  }

/* @Interval(5000)
  async test(){
    const result = await this.increment(Types.ObjectId('611c3838d5085320245deb25'),"eth",-0.001);
    console.log({result})
  }*/

  isValid (hash,secret){
    const apiKey =  this.configService.get("WALLET33_KEY");
    return secret === crypto.createHash('sha256').update(hash+":"+apiKey).digest('hex');
  }

  async transactionSend(fromWalletId, coinType:string, amount:number, toAddress, subtractFee=true){
    try {
      const response = await axios({
        method: 'post',
        url: this.configService.get("WALLET33_URL") + "/transaction/send",
        headers: {
          'apiKey':  this.configService.get("WALLET33_KEY"),
          'Content-Type':  'application/json',
        },
        data: {coinType, amount, toAddress, subtractFee}
      })
      return response.data;
    }catch (e) {
      console.error(e)
      throw new HttpException(Exceptions.UNKNOWN_ERROR, HttpStatus.CONFLICT);
    }
  }

  async increment(userId:Types.ObjectId, symbol: Symbol, amount: number):Promise<Wallet> {
    const validator = amount < 0 ? {amount:{$gte: Math.abs(amount)}} : {}
    const filter = {userId, symbol, ...validator};
    console.log({validator, filter})
    const increment = await this.walletModel.findOneAndUpdate(filter,{$inc:{amount}},{upsert:amount>0, new:true});

    if(!increment) {
      if(amount < 0) throw new HttpException(Exceptions.INSUFFICIENT_BALANCE, HttpStatus.PAYMENT_REQUIRED);
      else throw new HttpException(Exceptions.UNKNOWN_ERROR, HttpStatus.CONFLICT);
    }
    return increment;
  }


  async estimate(userId:Types.ObjectId, amountUsd: number, ignoreSymbols: Symbol[]):Promise<Wallet[]>{

    let leftUsd = amountUsd;
    const estimated = []
    const filter = {userId, symbol:{$nin:ignoreSymbols},amount:{$gt:0}};
    const wallets = await this.walletModel.find(filter);
    for(let wallet of wallets){
      if(leftUsd>0) {
        console.log("left",leftUsd)
        const needAmount = CurrencyService.fromUsd(wallet.symbol, leftUsd);
        const existAmount = Math.min(needAmount, wallet.amount);
        const existAmountUsd = CurrencyService.toUsd(wallet.symbol, existAmount);
        console.log({needAmount, existAmount,existAmountUsd})
        leftUsd -= existAmountUsd;
        estimated.push({symbol: wallet.symbol, amount: existAmount});
      }
    }
    if(leftUsd>0) return null;
    return estimated;
  }
}
