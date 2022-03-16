import {Body, Controller, Get, HttpException, HttpStatus, Post, Query, Redirect, Request} from "@nestjs/common";
import {UserService} from "./user.service";
import {CreateUserDto} from "./dto/create-user.dto";
import {User} from "./user.schema";
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags} from "@nestjs/swagger";
import {LoginUserDto} from "./dto/login-user.dto";
import {LoginUserResponse} from "./dto/login-user.response";
import {RequestModel} from "../auth/auth.middleware";
import {GetUserResponse} from "./dto/get-user.response";
import {CallbackWalletDto} from "./dto/callback-wallet.dto";
import {Schema, Types, ObjectId} from "mongoose";
import {WalletService} from "../wallet/wallet.service";
import {Events} from "../socket/events.enum";
import {SocketGateway} from "../socket/socket.gateway";
import {CheckLoginDto} from "./dto/check-login.dto";
import {ChangePasswordDto} from "./dto/change-password.dto";
import {Throttle} from "@nestjs/throttler";
import {RecoveryUserDto} from "./dto/recovery-user.dto";
import {WithdrawWalletResponse} from "./dto/withdraw-wallet.response";
import {WithdrawWalletDto} from "./dto/withdraw-wallet.dto";
import {BuyTokenDto} from "src/user/dto/buy-token.dto";
import {PasswordSetDto} from "src/user/dto/password-set.dto";
import {Exceptions} from "src/enums/exceptions.enum";
import {InfoStatResponse} from "src/user/dto/info-stat.response";

@Controller("user")
@ApiTags("User")
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly walletService: WalletService,
        private readonly socketGateway: SocketGateway
    ) {
    }

    @Post("get")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Получение объекта пользователя"})
    @ApiResponse({status: 201, type: GetUserResponse})
    async get(@Request() request: RequestModel): Promise<GetUserResponse> {
        const user = await this.userService.findOne(request.userId, true);
        this.socketGateway.emitOne(user._id, Events.USER_UPDATE, user);
        return {user};
    }


    @Post("create")
    @ApiOperation({summary: "Регистрация пользователя", description: ""})
    @ApiBody({type: CreateUserDto})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiResponse({status: 201, type: LoginUserResponse})
    async userCreate(@Body() createUserDto: CreateUserDto): Promise<LoginUserResponse> {
        const createdUser = await this.userService.create(createUserDto, true);
        return this.userService.login(createUserDto);
    }


    @Throttle(1, 2)
    @Get("username/get")
    @ApiOperation({summary: "Получение username по _id", description: "Лимит запросов 1 в 2 секунды с 1 IP"})
    @ApiQuery({name: "ref", type: String})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async username(@Query("ref") ref: string): Promise<string> {
        if (!Types.ObjectId(ref)) throw new HttpException(Exceptions.INVALID_CODE, HttpStatus.NOT_ACCEPTABLE);
        return await this.userService.getUserName(Types.ObjectId(ref));
    }


    @Post("wallet/callback")
    async callback(@Body() dto: CallbackWalletDto): Promise<string> {
        console.log(dto)
        if (!dto.transaction) throw new HttpException("transaction not found", HttpStatus.NOT_FOUND);
        if (!this.walletService.isValid(dto.transaction.hash, dto.secret)) throw new HttpException("Incorrect secret code", HttpStatus.NOT_ACCEPTABLE);
        return this.userService.wallet33callback(dto);
    }

    @Post("wallet/create")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Создание кошелька", description: ""})
    @ApiResponse({status: 201, type: GetUserResponse})
    async CreateWallet(@Request() req: RequestModel): Promise<GetUserResponse> {
        const user = await this.userService.walletCreate(req.userId);
        return {user};
    }


    @Post("wallet/withdraw")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "вывод с кошелька", description: ""})
    @ApiResponse({status: 201, type: WithdrawWalletResponse})
    async WithdrawWallet(@Request() req: RequestModel, @Body() walletWithdrawDto: WithdrawWalletDto): Promise<WithdrawWalletResponse> {
        const result = await this.userService.withdraw(req.userId, walletWithdrawDto.coinType, walletWithdrawDto.amount, walletWithdrawDto.toAddress);
        if (!result) throw new HttpException(Exceptions.WITHDRAW_TEMPORARY_NOT_AVAILABLE, HttpStatus.NOT_ACCEPTABLE);
        const {operation, user} = result;
        return {user, operation};
    }


    @Post("login")
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async login(@Body() loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
        return this.userService.login(loginUserDto);
    }


    @Throttle(1, 2)
    @Post("login/detect")
    @ApiOperation({summary: "Поиск логина", description: "true - если найден в базе, false - не найден"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async loginCheck(@Body() checkLoginDto: CheckLoginDto): Promise<boolean> {
        return await this.userService.loginCheck(checkLoginDto.login);
    }


    @Post("login/change")
    @ApiBearerAuth()
    @ApiBody({type: CheckLoginDto})
    @ApiOperation({summary: "Изменение логина", description: ""})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async loginChange(@Request() req: RequestModel, @Body() checkLoginDto: CheckLoginDto): Promise<GetUserResponse> {
        const user = await this.userService.loginChange(req.userId, checkLoginDto.login);
        this.socketGateway.emitOne(req.userId, Events.USER_UPDATE, user);
        return {user}
    }


    @Throttle(1, 30)
    @Post("email/verify")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiResponse({type: Boolean, description: "true if success"})
    async emailVerifyPost(@Request() req: RequestModel): Promise<boolean> {
        await this.userService.emailVerifyCodeSend(req.userId)
        return true;
    }


    @Get("email/verify/check")
    @ApiQuery({name: "email", type: String})
    @ApiQuery({name: "code", type: Number})
    @Redirect('/verify?status=fail', 302)
    async emailVerifyGet(@Request() req: RequestModel, @Query("email") email: string, @Query("code") code: string) {
        const success = await this.userService.emailVerifyCodeCheck(email, code)
        if (success) return {url: '/verify?status=success'};
    }


    @Post("password/change")
    @ApiBearerAuth()
    @ApiBody({type: ChangePasswordDto})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async passwordChange(@Request() req: RequestModel, @Body() changePasswordDto: ChangePasswordDto): Promise<LoginUserResponse> {
        const user = await this.userService.passwordChange(req.userId, changePasswordDto);
        this.socketGateway.emitOne(req.userId, Events.USER_UPDATE, user);
        return this.userService.login({email: user.email, password: changePasswordDto.newPassword})
    }


    @Throttle(1, 30)
    @Post("password/recovery")
    @ApiBody({type: RecoveryUserDto})
    @ApiOperation({
        summary: "Получение временного кода для смены почты",
        description: "Лимит запросов 1 в 30 секунд с 1 IP"
    })
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async passwordRecovery(@Body() recoveryUserDto: RecoveryUserDto): Promise<boolean> {
        await this.userService.passwordRecovery(recoveryUserDto.email)
        return true;
    }


    @Throttle(1, 10)
    @Post("password/recovery/set")
    @ApiOperation({
        summary: "Установление нового пароля",
        description: "После того как пользователь получил на почту ссылку для смены пароля - он переходит по ней и передает на фронт два параметра email,code. После чего пользователь вводит новый пароль и отправляется на этот endpoint вместе с кодом"
    })
    @ApiResponse({type: LoginUserResponse})
    @ApiBody({type: PasswordSetDto})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async passwordSet(@Body() passwordSetDto: PasswordSetDto): Promise<LoginUserResponse> {
        const user: User = await this.userService.passwordSet(passwordSetDto)
        return this.userService.login(passwordSetDto);
    }

    @Post("stat/info")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Получение статистики инвестиций, своих и партнеров", description: ""})
    @ApiResponse({status: 201, type: InfoStatResponse})
    async statusInfo(@Request() req: RequestModel): Promise<InfoStatResponse> {
        return this.userService.statInfo(req.userId);
    }


}
