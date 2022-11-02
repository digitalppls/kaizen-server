import {Body, Controller, Get, HttpException, HttpStatus, Post, Request} from "@nestjs/common";
import {UserService} from "./user.service";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiExcludeEndpoint,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags
} from "@nestjs/swagger";
import {RequestModel} from "../auth/auth.middleware";
import {GetUserResponse} from "./dto/get-user.response";
import {CallbackWalletDto} from "./dto/callback-wallet.dto";
import {WalletService} from "../wallet/wallet.service";
import {WithdrawWalletResponse} from "./dto/withdraw-wallet.response";
import {WithdrawWalletDto} from "./dto/withdraw-wallet.dto";
import {Exceptions} from "src/enums/exceptions.enum";
import {Symbol} from "src/currency/currency.schema";

@Controller("user/wallet")
@ApiTags("💼 Кошелек")
export class UserWalletController {
    constructor(
        private readonly userService: UserService,
        private readonly walletService: WalletService
    ) {
    }


    @ApiExcludeEndpoint(true)
    @Post("callback")
    async callback(@Body() dto: CallbackWalletDto): Promise<string> {
        console.log(dto)
        if (!dto.transaction) throw new HttpException("transaction not found", HttpStatus.NOT_FOUND);
        if (!this.walletService.isValid(dto.transaction.hash, dto.secret)) throw new HttpException("Incorrect secret code", HttpStatus.NOT_ACCEPTABLE);
        return this.userService.wallet33callback(dto);
    }

    @Post("create")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Создание кошелька", description: ""})
    @ApiResponse({status: 201, type: GetUserResponse})
    async CreateWallet(@Request() req: RequestModel): Promise<GetUserResponse> {
        const user = await this.userService.walletCreate(req.userId);
        return {user};
    }


    @Post("withdraw")
    @ApiBearerAuth()
    @ApiBody({type: WithdrawWalletDto})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "вывод с кошелька", description: ""})
    @ApiResponse({status: 201, type: WithdrawWalletResponse})
    async WithdrawWallet(@Request() req: RequestModel, @Body() walletWithdrawDto: WithdrawWalletDto): Promise<WithdrawWalletResponse> {
        const result = await this.userService.withdraw(req.userId, walletWithdrawDto.coinType, walletWithdrawDto.amount, walletWithdrawDto.toAddress);
        if (!result) throw new HttpException(Exceptions.WITHDRAW_TEMPORARY_NOT_AVAILABLE, HttpStatus.NOT_ACCEPTABLE);
        const {operation, user} = result;
        return {user, operation};
    }


    @Get("withdraw/list")
    @ApiOperation({summary: "Список доступных символов на вывод", description: ""})
    @ApiResponse({status: 201})
    WithdrawList(@Request() req: RequestModel): Symbol[] {
        return this.userService.WITHDRAW_ALLOWED;
    }


}
