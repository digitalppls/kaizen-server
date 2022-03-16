import {HttpException, HttpStatus, Injectable} from "@nestjs/common";

import {User, UserDocument, UserPermission} from "./user.schema";
import {Model, Schema, Types, ObjectId} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";

import {WalletService} from "../wallet/wallet.service";
import {Operation, OperationStatus, OperationType} from "../operation/operation.schema";
import {OperationService} from "../operation/operation.service";
import {Exceptions} from "../enums/exceptions.enum";
import {LoginUserDto} from "./dto/login-user.dto";
import {LoginUserResponse} from "./dto/login-user.response";
import {CreateUserDto} from "./dto/create-user.dto";
import {AuthService} from "../auth/auth.service";
import {SocketGateway} from "../socket/socket.gateway";
import {CreateUserTelegramDto} from "./dto/create-user-telegram.dto";
import {JwtStrategy} from "../auth/jwt.strategy";
import {Events} from "../socket/events.enum";
import {ChangePasswordDto} from "./dto/change-password.dto";
import {WithdrawWalletResponse} from "./dto/withdraw-wallet.response";
import {TransactionInterface} from "./dto/transaction.interface";

import {CurrencyService} from "src/currency/currency.service";
import {EmailService} from "src/email/email.service";
import {PasswordSetDto} from "src/user/dto/password-set.dto";
import {CallbackWalletDto} from "src/user/dto/callback-wallet.dto";
import {StatusService} from "src/status/status.service";
import {InfoStatResponse} from "src/user/dto/info-stat.response";
import {Symbol} from "src/currency/currency.schema";
import {Status} from "src/status/status.schema";



@Injectable()
export class UserService {


    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly walletService: WalletService,
        private readonly authService: AuthService,
        private readonly socketGateway: SocketGateway,
        private readonly operationService: OperationService,
        private readonly sendGridService: EmailService,
        private readonly statusService:StatusService,
    ) {
    }


    async findAgents(): Promise<User[]> {
        return this.userModel.find({permissions: UserPermission.SUPPORT});
    }

    async create(createUserDto: CreateUserDto | CreateUserTelegramDto, withWallets: boolean = false): Promise<User> {



        if (createUserDto.email && await this.userModel.findOne({email: createUserDto.email.toLowerCase()}))
            throw new HttpException("Email is already in use", HttpStatus.CONFLICT);

        let fathers = [];
        if (createUserDto.ref) {
            const q = createUserDto.ref.length===24 ? {_id:Types.ObjectId(createUserDto.ref)} : {num_id:Number(createUserDto.ref)}
            const father = await this.findOne(q, false);
            fathers = father.fathers;
            fathers.unshift(father._id);
        }

        const {_id, assets} = withWallets ? await this.walletService.create() : {_id: null, assets: null};
        const {email, password, chat_id, username, first_name, last_name, language_code} = createUserDto;



        const count = await this.userModel.countDocuments();

        return await this.userModel.create({
            num_id: count + 1,
            fathers,
            email: email.toLowerCase(),
            password: await this.hashPassword(password),
            chat_id, username, first_name, last_name, language_code, wallet33Id: _id, wallet33Assets: assets
        });
    }

    async login(loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
        const user: User = await this.userModel.findOne({email: loginUserDto.email.toLowerCase()}).populate("wallets");
        if (!user) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_FOUND);

        const matches: boolean = await this.validatePassword(loginUserDto.password, user.password);
        if (!matches) throw new HttpException(Exceptions.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

        return {
            user,
            access_token: await this.authService.generateJwt(user),
            token_type: "JWT",
            expires_in: JwtStrategy.expirationsSeconds
        };

    }

    private async hashPassword(password: string): Promise<string> {
        return this.authService.hashPassword(password);
    }

    private async validatePassword(password: string, storedPasswordHash: string): Promise<any> {

        console.log({password, storedPasswordHash})

        return this.authService.comparePasswords(password, storedPasswordHash);
    }

    async walletCreate(userId: Types.ObjectId): Promise<User> {
        const {_id, assets} = await this.walletService.create();

        const user = await this.userModel.findOneAndUpdate({
            _id: userId,
            emailVerified: true,
            wallet33Id: null
        }, {wallet33Id: _id, wallet33Assets: assets}, {new: true}).populate("wallets");
        if (!user)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.CONFLICT);
        else
            return user;
    }

    public async walletIncrement(userId: Types.ObjectId, symbol: Symbol, amount: number, type: OperationType, targetId?: Types.ObjectId, status?: OperationStatus, hash?: string, customerId?: Types.ObjectId, updateUser:boolean=true, line?:number): Promise<{ user: User; operations: Operation[] }> {
        const operations: Operation[] = [];

        // if (symbol.substring(0, 1) === "!") { // Перебираем все кошельки кроме одного и в эквиваленте в $ берем
        //     const estimate: Wallet[] = await this.walletService.estimate(userId, Math.abs(amount), [symbol.substring(1)])
        //     if (!estimate) throw new HttpException(Exceptions.INSUFFICIENT_BALANCE, HttpStatus.PAYMENT_REQUIRED);
        //     for (let item of estimate) {
        //         await this.walletService.increment(userId, item.symbol, item.amount * (amount / Math.abs(amount)));
        //         operations.push(await this.operationService.create({
        //             amount: item.amount,
        //             symbol: item.symbol,
        //             userId,
        //             type,
        //             targetId
        //         }, status, hash, customerId,line));
        //     }
        // } else {
            await this.walletService.increment(userId, symbol, amount);
            operations.push(await this.operationService.create({amount, symbol, userId, type, targetId}, status, hash,customerId,line));
       // }

        if (updateUser) {
            const user = await this.findOne(userId, true);
            this.socketGateway.emitOne(user._id, Events.USER_UPDATE, user);
            return {user, operations};
        } else {
            return {user: null, operations};
        }
    }

    async findOne(query: any | Types.ObjectId | string | number, wallets?: boolean): Promise<User> {
        console.log(typeof query, query)
        const q = (typeof query === 'object')
            ? this.userModel.findOne(query)
            : this.userModel.findById(typeof query === "string" ? Types.ObjectId(query) : query);
        return wallets ? q.populate("wallets") : q;
    }

    async loginCheck(login: string): Promise<boolean> {
        const user = await this.userModel.findOne({login}, {login: true});
        return !!user;
    }

    async loginChange(userId: Types.ObjectId, login: string): Promise<User> {
        if (await this.loginCheck(login)) throw new HttpException(Exceptions.ALREADY_EXIST, HttpStatus.CONFLICT)
        return this.userModel.findByIdAndUpdate(userId, {$set: {login}}, {new: true}).populate("wallets");
    }

    async passwordChange(userId: Types.ObjectId, dto: ChangePasswordDto): Promise<User> {
        const user: UserDocument = await this.findOne({_id: userId}, true) as UserDocument;
        const matches: boolean = await this.validatePassword(dto.oldPassword, user.password);
        if (!matches) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.CONFLICT);
        user.password = await this.hashPassword(dto.newPassword);
        await user.save();
        return user;
    }

    async withdraw(userId: Types.ObjectId, coinType:string, amount: number, toAddress: string): Promise<WithdrawWalletResponse> {
        // const symbol = coinType.split("20").reverse()[0] as Symbol;
        const symbol = Symbol.USD;
        if(!["bep20usdt","trc20usdt","erc20usdt"].includes(coinType)) throw new HttpException(Exceptions.INCORRECT_TYPE, HttpStatus.NOT_ACCEPTABLE);
        await this.walletService.increment(userId, symbol, -Math.abs(amount));
        const amountUsd = CurrencyService.toUsd(symbol, amount);
        const user = await this.findOne(userId, true);

        let transaction;
        try {
            transaction = await this.walletService.transactionSend(user.wallet33Id, coinType, amount, toAddress)
            this.socketGateway.emitOne(user._id, Events.USER_UPDATE, user);
            const operation = await this.operationService.create({amount, symbol, userId, type: OperationType.WITHDRAW, targetId: transaction._id}, OperationStatus.TRANSACTION);
            return {user, operation}
        }catch (err){
            // RETURN AMOUNT
            await this.walletService.increment(userId, symbol, Math.abs(amount));
            console.error(err.request?.data?.message);
            return null;
        }
    }

    async walletWithdrawChangeStatus(transaction: TransactionInterface): Promise<Operation> {
        const operation = await this.operationService.updateOne({targetId: transaction._id}, {
            $set: {
                status: transaction.status,
                hash: transaction.hash
            }
        });
        return operation;
    }

    async emailVerifyCodeSend(userId: Types.ObjectId) {
        const user = await this.findOne(userId);
        if (!user) throw new HttpException(Exceptions.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        if (user.emailVerified) throw new HttpException(Exceptions.ALREADY_COMPLETE, HttpStatus.CONFLICT);
        this.sendGridService.sendVerify(user.email);
    }

    emailVerifyCodeCheck(to: string, code: string): boolean {
        const c = this.sendGridService.getSentCode(to, code);
        if (c === undefined || c === null) return false;

        console.log({c})
        this.userModel.updateOne({email: to}, {$set: {emailVerified: true}}).then();
        return true;
    }

    async checkStatusUp(users:User[]):Promise<{user:User, newStatus:Status}[]> {
        // Check status update - проверяем не достгнут ли новый статус
        const list: {user:User, newStatus:Status}[] = [];
        for(let user of users){
            // Находим тех за кого получали линайных бонус в 1 линии
            const {self_invest_usd, first_line_invest_usd, structure_invest_usd} = await this.statInfo(user._id)
            const nextStatus = await this.statusService.getNextStatusByParams({self_invest_usd,first_line_invest_usd,structure_invest_usd})
            if(nextStatus && user.status<nextStatus.id){
                await this.userModel.updateOne({_id:user._id},{$set:{status:nextStatus.id}});
                const amount = CurrencyService.fromUsd(nextStatus.prize_symbol, nextStatus.prize_usd);
                await this.walletIncrement(user._id, nextStatus.prize_symbol, amount, OperationType.STATUS_UP_BONUS, nextStatus._id, undefined,undefined,undefined,true, nextStatus.id);
                list.push({user, newStatus:nextStatus });
            }
        }
        return list;
    }

    async statInfo(userId:Types.ObjectId):Promise<InfoStatResponse>{
        const firstLinePartners = await this.operationService.findCustomersOfOperations(userId, OperationType.PACKAGE_REF_BONUS, 1);
        const allPartners = await this.operationService.findCustomersOfOperations(userId, OperationType.PACKAGE_REF_BONUS);
        const self_invest_usd = Math.abs(await this.operationService.sumOfInvests([userId]));
        const first_line_invest_usd = Math.abs(await this.operationService.sumOfInvests(firstLinePartners));
        const structure_invest_usd = Math.abs(await this.operationService.sumOfInvests(allPartners));

        console.log({firstLinePartners,allPartners,self_invest_usd,first_line_invest_usd,structure_invest_usd})

        return {self_invest_usd, first_line_invest_usd, structure_invest_usd}
    }

    async passwordRecovery(email: string) {
        const user = await this.findOne({email});
        if (!user) throw new HttpException(Exceptions.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        this.sendGridService.sendRecovery(user.email);
    }

    async passwordSet(passwordSetDto: PasswordSetDto): Promise<User> {
        const c = this.sendGridService.getSentCode(passwordSetDto.email, passwordSetDto.code);
        if (c === undefined || c === null) throw new HttpException(Exceptions.INVALID_CODE, HttpStatus.UNAUTHORIZED);
        const password = await this.hashPassword(passwordSetDto.password);
        const user = await this.userModel.findOneAndUpdate({email: passwordSetDto.email}, {$set: {password}}, {new: true});
        return user;
    }

    async getUserName(_id: Types.ObjectId | number): Promise<string> {
        const q = (_id+"").length===24 ? {_id} : {num_id:Number(_id)}
        console.log({q})
        const user = await this.userModel.findOne(q, {username: 1});
        if(!user) throw new HttpException(Exceptions.USER_NOT_FOUND,HttpStatus.NOT_FOUND);
            return user.username
    }

    async refLine(myId: Types.ObjectId, userId: Types.ObjectId, line: number): Promise<User[]> {
        const user = await this.userModel.findById(userId, {fathers: true});
        if (!user) throw new HttpException(Exceptions.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

        console.log(user)

        if (user._id + '' != '' + myId && !(user.fathers.map(x => x + '').includes(myId + ''))) throw new HttpException(Exceptions.ACCESS_DENY, HttpStatus.NOT_ACCEPTABLE);
        return this.userModel.find({["fathers." + (line - 1)]: userId}, {
            date: 1,
            username: 1,
            login: 1,
            firstName: 1,
            lastName: 1
        }).populate("products");
    }

    async getRefNum(_id: Types.ObjectId): Promise<number> {
        return this.userModel.countDocuments({"fathers.0": _id});
    }


    async listUserFatherStatuses(user:User):Promise<User[]>{
       return this.userModel.find({_id:{$in:user.fathers}},{status:1});
    }

    async wallet33callback(dto: CallbackWalletDto):Promise<string> {
        const wallet33Id =  Types.ObjectId(dto.transaction.toWalletId);
        const user: User = await this.findOne({wallet33Id}, false);
        if (!user) return "user not found";
        if (dto.transaction.type === "input") {
            let symbol = dto.transaction.coinType.split("20").reverse()[0] as Symbol;
            let amount = dto.transaction.amount;

            if(!Object.values(Symbol).includes(symbol)) return "unsupported coin";

                amount = CurrencyService.toUsd(symbol, amount);
                symbol = Symbol.USD;
            if (dto.transaction.status === OperationStatus.CONFIRMED)
                await this.walletIncrement(user._id, symbol, amount, OperationType.PAYMENT, dto.transaction._id, OperationStatus.CONFIRMED, dto.transaction.hash);
        } else if (dto.transaction.type === 'output')
            this.walletWithdrawChangeStatus(dto.transaction).then();
        return "ok"
    }

    setLanguageCode(userId:Types.ObjectId, language_code: string) {
        this.userModel.updateOne({_id:userId},{$set:{language_code}}).then();
    }

    async childsIds(fathers: Types.ObjectId[]):Promise<Types.ObjectId[]> {
        return (await this.userModel.aggregate([
            {$match:{fathers:{$in:fathers}}},
            {$project:{_id:true}}
        ])).map(x=>x._id)
    }
}
