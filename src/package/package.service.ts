import {CacheTTL, HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";
import {Package, PackageDocument} from "./package.schema";
import {Exceptions} from "src/enums/exceptions.enum";
import {UserService} from "src/user/user.service";
import {BuyPackageDto} from "src/package/dto/buy-package.dto";
import {UserPackage, UserPackageDocument} from "src/package/user-package.schema";
import {Operation, OperationType} from "src/operation/operation.schema";
import {CurrencyService} from "src/currency/currency.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {OperationService} from "src/operation/operation.service";
import {WithdrawPackageDto} from "src/package/dto/withdraw-package.dto";
import {WithdrawPackageResponse} from "src/package/dto/withdraw-package.response";
import {Symbol} from "src/currency/currency.schema";
import {User} from "src/user/user.schema";
import {Status} from "src/status/status.schema";
import {BonusPackageService} from "src/package/bonus-package.service";
import {UserPackageResponse} from "src/package/dto/user-package.response";


@Injectable()
export class PackageService {
    constructor(
        private readonly userService: UserService,
        private readonly bonusPackageService:BonusPackageService,
        private readonly operationService: OperationService,
        @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
        @InjectModel(UserPackage.name) private userPackageModel: Model<UserPackageDocument>,
    ) {
    }


    @CacheTTL(20)
    async list(): Promise<Package[]> {
        return this.packageModel.find({}).sort({line: 1});
    }


    @CacheTTL(20)
    async get(_id: string | Types.ObjectId): Promise<Package> {
        return this.packageModel.findById(_id);
    }

    async getMy(userId:Types.ObjectId, _id: string | Types.ObjectId): Promise<UserPackage> {
        return this.userPackageModel.findOne({userId,_id}).populate("package");
    }

    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async farm(){
        const list:Package[] = await this.list();
        for(let thepackage of list){
            const todayPercent:number = thepackage.minDailyPercent+Math.random()*(thepackage.maxDailyPercent-thepackage.minDailyPercent);
            let totalProfitAmountUsd = {$multiply: ["$investedAmountUsd", 1+thepackage.totalProfitPercent/100]}
            let $expr = { $lt: [ "$farmedAmountUsd" , totalProfitAmountUsd ] }
            // let $inc = {farmedAmountUsd:{$mul:["$investedAmountUsd",todayPercent/100]}}
            const userPackages:UserPackage[] = await this.userPackageModel.find({package:thepackage._id,  $expr })
            for(let userPackage of userPackages){
                const farmedAmountUsd = Number(userPackage.investedAmountUsd)*todayPercent/100;
                // const farmedAmountFCoin = CurrencyService.fromUsd(Symbol.FCOIN, farmedAmountUsd);
                this.userPackageModel.updateOne({_id:userPackage._id},{$inc:{farmedAmountUsd}}).then()
                this.operationService.create({amount:farmedAmountUsd, symbol:Symbol.USD, userId:userPackage.userId, targetId:userPackage._id, type:OperationType.PACKAGE_FARMING}).then()
                Logger.log("FARMING",(Number(userPackage.farmedAmountUsd)+farmedAmountUsd)+' / '+(Number(userPackage.investedAmountUsd)*(1+thepackage.totalProfitPercent/100)))
            }
        }

    }

    async save(p: Package) {
        const values = Object.values(p).filter(x => x);
        console.log(values);
        if (values.length === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (values.length === 1 && p._id)
            return this.packageModel.findByIdAndRemove(p._id);
        else if (p._id)
            return this.packageModel.findByIdAndUpdate(p._id, {$set: p});
        else
            return this.packageModel.create(p)
    }


    async buy(userId: Types.ObjectId, dto: BuyPackageDto): Promise<UserPackageResponse> {
        const thepackage = await this.get(Types.ObjectId(dto._id));
        if (!thepackage) throw new HttpException(Exceptions.ITEM_NOT_FOUND, HttpStatus.NOT_FOUND)

        if(!thepackage.symbols.replace(/ /g,"").toLowerCase().split(",").includes(dto.symbol)) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.CONFLICT);
        const investedAmountUsd = CurrencyService.toUsd(dto.symbol, dto.amount);

        console.log({investedAmountUsd, dto})
        if(investedAmountUsd<thepackage.minAmountUsd) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.CONFLICT);
        if(investedAmountUsd>thepackage.maxAmountUsd) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.CONFLICT);

        // const fee = await this.userService.walletIncrement(userId, Symbol.ORO, -1, OperationType.PACKAGE_BUY_FEE, thepackage._id, undefined, undefined, userId, true);

        const packageBuy = await this.userService.walletIncrement(userId, dto.symbol, -dto.amount, OperationType.PACKAGE_BUY, thepackage._id, undefined, undefined, userId, true);
        const fathers = await this.bonusPackageService.send(packageBuy.user,packageBuy.operations);
        const statusUps:{user:User, newStatus:Status}[] = await this.userService.checkStatusUp([packageBuy.user,...fathers])

        // Увеличиваем депозит одного из пакета пользователей за статус
        for(let statusUp of statusUps){
            const userPackage = await this.userPackageModel.findOne({userId:statusUp.user._id}).sort({investedAmountUsd:-1});
            if(userPackage){
                const investedAmountUsd = statusUp.newStatus.package_up_usd;
                await this.userPackageModel.updateOne({_id:userPackage._id}, {$inc: {investedAmountUsd}});
                await this.operationService.create({userId:statusUp.user._id, type:OperationType.STATUS_UP_BONUS_PACKAGE, amount:investedAmountUsd, symbol:Symbol.USD, targetId:statusUp.newStatus._id})
            }
        }

        const userPackage = await this.userPackageModel.create({userId, package:thepackage._id, investedAmountUsd});
        return {userPackage, operations:[/*...fee.operations,*/...packageBuy.operations]}
    }

    async listMy(userId: Types.ObjectId):Promise<UserPackage[]> {
        return this.userPackageModel.find({userId}).sort({date:-1}).populate("package");
    }

    async withdraw(userId: Types.ObjectId, dto: WithdrawPackageDto):Promise<WithdrawPackageResponse> {
        console.log({dto})
        let userPackage = await this.getMy(userId, Types.ObjectId(dto._id));
        if (!userPackage) throw new HttpException(Exceptions.ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);

        // Проверяем чтобы начислений было достаточно для вывода
        if(userPackage.farmedAmountUsd<=userPackage.withdrawnAmountUsd)throw new HttpException(Exceptions.INSUFFICIENT_BALANCE, HttpStatus.NOT_ACCEPTABLE);
        // Проверяем чтобы последний вывод был не ближе нужного интервала
        const withdrawDate = new Date(userPackage.withdrawnDate)
        const accessedWithdrawDate = new Date();
              accessedWithdrawDate.setDate(accessedWithdrawDate.getDate()-(userPackage.package as Package).withdrawIntervalDays);
        if(withdrawDate>accessedWithdrawDate) throw new HttpException(Exceptions.INCORRECT_DATE, HttpStatus.NOT_ACCEPTABLE);

        const amountUsd = userPackage.farmedAmountUsd-userPackage.withdrawnAmountUsd;
        // const amountFCoin = CurrencyService.fromUsd(Symbol.FCOIN, amountUsd);
        userPackage = await this.userPackageModel.findByIdAndUpdate(userPackage._id, {$set:{withdrawnAmountUsd:userPackage.farmedAmountUsd, withdrawnDate:new Date()}},{new:true});
        const {user} = await this.userService.walletIncrement(userId,Symbol.USD, amountUsd,OperationType.PACKAGE_WITHDRAW, userPackage._id,undefined,undefined,undefined,true);
        return {user, userPackage};
    }
}
