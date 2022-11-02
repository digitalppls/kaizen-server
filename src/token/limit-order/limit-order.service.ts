import {HttpException, HttpStatus, Injectable,} from '@nestjs/common';
import {Model, Types} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";
import {LimitOrder, LimitOrderDirection, LimitOrderDocument} from "./limit-order.schema";
import {Exceptions} from "src/enums/exceptions.enum";
import {UserService} from "src/user/user.service";
import {OperationType} from "src/operation/operation.schema";
import {Symbol} from "src/currency/currency.schema";


@Injectable()
export class LimitOrderService {

    constructor(
        private readonly userService:UserService,
        @InjectModel(LimitOrder.name) private limitOrderModel: Model<LimitOrderDocument>
    ) {
    }

    async list(userId?:Types.ObjectId):Promise<LimitOrder[]> {
        return this.limitOrderModel.find(userId?{userId}:{}).sort({date:1}).limit(1000).populate("user")
    }

    async save(userId:Types.ObjectId, limitOrder: LimitOrder):Promise<LimitOrder> {
        // Если указали не свой id
        if(limitOrder.userId && userId+''!==limitOrder.userId) throw new HttpException(Exceptions.ACCESS_DENY, HttpStatus.NOT_ACCEPTABLE)
        if(limitOrder.amount!== undefined && limitOrder.amount<=0 ) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        if(limitOrder.priceUsd!== undefined && limitOrder.priceUsd<=0 ) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);

        if(limitOrder.userId)limitOrder.userId=Types.ObjectId(limitOrder.userId+'')


        const values = Object.values(limitOrder).filter(x=>x)
        console.log(values);
        if(values.length===0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if(values.length===1 && limitOrder._id) {
            const removed:LimitOrder = await this.limitOrderModel.findOneAndRemove({_id:limitOrder._id, userId});
            if(!removed) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
            if(removed.direction===LimitOrderDirection.SELL) await this.userService.walletIncrement(userId, removed.symbol, removed.amount, OperationType.CLOSE_LIMIT_ORDER, removed._id);
            if(removed.direction===LimitOrderDirection.BUY) await this.userService.walletIncrement(userId, Symbol.USDT, removed.amount * removed.priceUsd, OperationType.CLOSE_LIMIT_ORDER, removed._id);
            console.log({removed})
            return removed;
        } else if(limitOrder._id) {

            let finded:LimitOrder = await this.limitOrderModel.findOne({_id:limitOrder._id, userId});
            if(!finded) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
            if(limitOrder.symbol && finded.symbol!==limitOrder.symbol) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
            if(finded.amount<=0 || finded.priceUsd<=0) throw new HttpException(Exceptions.ALREADY_COMPLETE, HttpStatus.NOT_ACCEPTABLE);

            if(!limitOrder.amount) limitOrder.amount = finded.amount;
            if(!limitOrder.priceUsd) limitOrder.priceUsd = finded.priceUsd;

            const diffAmount =  finded.direction === LimitOrderDirection.SELL
                ? finded.amount - limitOrder.amount
                : finded.amount * finded.priceUsd - limitOrder.amount * limitOrder.priceUsd

            if(diffAmount !==0 && finded.direction===LimitOrderDirection.SELL) await this.userService.walletIncrement(userId, finded.symbol, diffAmount, OperationType.EDIT_LIMIT_ORDER, finded._id);
            if(diffAmount !==0 && finded.direction===LimitOrderDirection.BUY) await this.userService.walletIncrement(userId, Symbol.USDT, diffAmount, OperationType.EDIT_LIMIT_ORDER, finded._id);



            finded.amount=limitOrder.amount;
            finded.priceUsd=limitOrder.priceUsd;

            if(finded.direction===LimitOrderDirection.SELL) finded = await this.sellMyTokens(finded)
            if(finded.direction===LimitOrderDirection.BUY) finded = await this.buyThemTokens(finded)
            await (finded as LimitOrderDocument).save();
            console.log("----",finded.amount)
            if(finded.amount<=0) await this.limitOrderModel.deleteOne({_id:finded._id})



            console.log({updated:finded})
            return finded;
        } else {
            if(!limitOrder.userId) throw new HttpException(Exceptions.ACCESS_DENY, HttpStatus.NOT_ACCEPTABLE)
            if(!limitOrder.amount) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
            if(!limitOrder.priceUsd) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
            if(!limitOrder.direction) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
            if(!limitOrder.symbol) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);


            if(limitOrder.direction===LimitOrderDirection.SELL) await this.userService.walletIncrement(userId, limitOrder.symbol, -limitOrder.amount, OperationType.OPEN_LIMIT_ORDER);
            if(limitOrder.direction===LimitOrderDirection.BUY) await this.userService.walletIncrement(userId, Symbol.USDT, -limitOrder.amount * limitOrder.priceUsd, OperationType.OPEN_LIMIT_ORDER);

            if(limitOrder.direction===LimitOrderDirection.SELL) limitOrder = await this.sellMyTokens(limitOrder)
            if(limitOrder.direction===LimitOrderDirection.BUY) limitOrder = await this.buyThemTokens(limitOrder)
            if(limitOrder.amount>0) await this.limitOrderModel.create(limitOrder);

            return limitOrder;
        }
    }



    async sellMyTokens(seller:LimitOrder):Promise<LimitOrder>{
        const filter = {direction: LimitOrderDirection.BUY, symbol:seller.symbol, priceUsd:{$gte:seller.priceUsd}, amount:{$gt:0}}
        console.log(filter)
        const buyer = await this.limitOrderModel.findOne(filter);
        if(!buyer) return seller;
        const sellAmount = Math.min(buyer.amount, seller.amount)
        const buyerAmount = buyer.amount - sellAmount;
        const updated = buyerAmount === 0
            ?   await this.limitOrderModel.deleteOne({_id:buyer._id})
            :   await this.limitOrderModel.updateOne({_id:buyer._id},{$set:{amount:buyerAmount}})
        if(!updated.ok) return seller;

        seller.amount-=sellAmount;

        // try {
        //     await this.userService.walletIncrement(buyer.userId, Symbol.USDT, - sellAmount * buyer.priceUsd, OperationType.BUY_LIMIT_ORDER, undefined, undefined, undefined, seller.userId)
        // }catch (err){
        //     await buyer.remove();
        //     return await this.sellMyTokens(seller)
        // }
        //
        // try {
        //     await this.userService.walletIncrement(seller.userId, seller.symbol, - sellAmount, OperationType.SELL_LIMIT_ORDER, undefined, undefined, undefined, buyer.userId)
        // }catch (err){
        //     await this.userService.walletIncrement(buyer.userId, Symbol.USDT,  sellAmount * buyer.priceUsd, OperationType.REVERT_LIMIT_ORDER, undefined, undefined, undefined, seller.userId)
        //     seller.amount=0;
        //     return seller;
        // }

        await this.userService.walletIncrement(buyer.userId, seller.symbol, sellAmount, OperationType.BUY_LIMIT_ORDER, seller._id, undefined, undefined, seller.userId )
        await this.userService.walletIncrement(seller.userId, Symbol.USDT, sellAmount * buyer.priceUsd, OperationType.SELL_LIMIT_ORDER, buyer._id, undefined,undefined, buyer.userId)


        const returnChange = sellAmount*buyer.priceUsd - sellAmount*seller.priceUsd;
        if(returnChange>0)await this.userService.walletIncrement(buyer.userId, Symbol.USDT, returnChange, OperationType.CHANGE_LIMIT_ORDER, seller._id, undefined,undefined, seller.userId)

        return seller.amount > 0? await this.sellMyTokens(seller) : seller
    }



    async buyThemTokens(buyer:LimitOrder):Promise<LimitOrder>{
        const filter = {direction: LimitOrderDirection.SELL, symbol:buyer.symbol, priceUsd:{$lte:buyer.priceUsd}, amount:{$gt:0}}
        const seller = await this.limitOrderModel.findOne(filter);
        if(!seller) return buyer;
        const buyAmount = Math.min(seller.amount, buyer.amount)
        const sellerAmount = seller.amount - buyAmount;
        const updated = sellerAmount === 0
            ?   await this.limitOrderModel.deleteOne({_id:seller._id})
            :   await this.limitOrderModel.updateOne({_id:seller._id},{$set:{amount:sellerAmount}})
        if(!updated.ok) return buyer;
        buyer.amount-=buyAmount;


        // try {
        //     await this.userService.walletIncrement(seller.userId, seller.symbol, - buyAmount, OperationType.SELL_LIMIT_ORDER, undefined, undefined, undefined, buyer.userId )
        // }catch (err){
        //     await seller.remove();
        //     return await this.buyThemTokens(buyer)
        // }
        //
        // try {
        //     await this.userService.walletIncrement(buyer.userId, Symbol.USDT, - buyAmount * seller.priceUsd, OperationType.BUY_LIMIT_ORDER, undefined, undefined, undefined, seller.userId)
        // }catch (err){
        //     await this.userService.walletIncrement(seller.userId, Symbol.USDT,  buyAmount, OperationType.REVERT_LIMIT_ORDER, undefined, undefined, undefined, buyer.userId)
        //     buyer.amount=0;
        //     return buyer;
        // }


        await this.userService.walletIncrement(seller.userId, Symbol.USDT, buyAmount*seller.priceUsd, OperationType.SELL_LIMIT_ORDER, buyer._id, undefined, undefined, buyer.userId )
        await this.userService.walletIncrement(buyer.userId, buyer.symbol, buyAmount, OperationType.BUY_LIMIT_ORDER, seller._id, undefined,undefined, seller.userId)

        const returnChange = buyAmount*buyer.priceUsd - buyAmount*seller.priceUsd;
        if(returnChange>0)await this.userService.walletIncrement(buyer.userId, Symbol.USDT, returnChange, OperationType.CHANGE_LIMIT_ORDER, seller._id, undefined,undefined, seller.userId)

        return buyer.amount>0 ? await this.buyThemTokens(buyer) : buyer;
    }



}
