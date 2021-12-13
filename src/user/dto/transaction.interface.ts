import { Types } from "mongoose";


export class TransactionInterface{
  _id: Types.ObjectId;
  type: string;
  coinType: string;
  amount: number;
  status: string;
  fromAddress:string;
  toAddress:string;
  fromWalletId:string;
  toWalletId:string;
  hash:string;
  date:Date;
  blockNumber:number;
  fee:number;
  isInternal:boolean;
}
