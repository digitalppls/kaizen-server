import {Body, Controller, Get, HttpException, HttpStatus, Post, Query, Request} from '@nestjs/common';
import {RequestModel} from "../auth/auth.middleware";
import {Operation} from "./operation.schema";
import {OperationService} from "./operation.service";
import {ListOperationDto} from "./dto/list-operation.dto";
import {ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ListOperationResponse} from "./dto/list-operation.response";
import {Types} from "mongoose";
import {Exceptions} from "src/enums/exceptions.enum";
import {GetOperationResponse} from "src/operation/dto/get-operation.response";

@ApiTags("Operations")
@ApiBearerAuth()
@Controller('operation')
export class OperationController {

    constructor(
        private readonly operationService:OperationService
    ) {
    }
    @Post("list")
    @ApiProperty({type:ListOperationDto})
    @ApiResponse({type:[Operation]})
    @ApiOperation({description:"Получение списка операций пользователя"})
    async list(@Request() req:RequestModel, @Body() dto:ListOperationDto):Promise<ListOperationResponse>{
        return this.operationService.list(req.userId, dto);
    }

    @Get("get")
    @ApiQuery({name:"_id", description:"_id операции"})
    @ApiOperation({description:"Получение операции по _id"})
    async get(@Query("_id") _id:string):Promise<GetOperationResponse>{
        if(!Types.ObjectId(_id)) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        return {operation: await this.operationService.get(Types.ObjectId(_id))};
    }
}
