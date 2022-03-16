import {Body, Controller, HttpException, HttpStatus, Post, Request} from '@nestjs/common';
import {Throttle} from "@nestjs/throttler";
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {LineRefDto} from "./dto/line-ref.dto";
import {ListRefResponse} from "./dto/list-ref.response";
import {RequestModel} from "src/auth/auth.middleware";
import {Exceptions} from "src/enums/exceptions.enum";
import {RefService} from "src/ref/ref.service";
import {Types} from "mongoose";

@ApiTags("Ref")
@Controller('ref')
export class RefController {

    constructor(
        private readonly refService: RefService
    ) {
    }

    @Throttle(1, 2)
    @Post("list")
    @ApiBearerAuth()
    @ApiOperation({summary: "Список рефералов пользователя на определенной линии", description: ""})
    @ApiBody({type: LineRefDto})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiResponse({type: ListRefResponse, description: "Список рефералов"})
    async list(@Request() req: RequestModel, @Body() dto: LineRefDto): Promise<ListRefResponse> {
        if (dto._id && !Types.ObjectId(dto._id)) throw new HttpException(Exceptions.USER_NOT_FOUND, HttpStatus.NOT_ACCEPTABLE);
        return this.refService.list(req.userId, dto._id ? Types.ObjectId(dto._id) : req.userId, dto.line ? dto.line : 1);
    }


}
