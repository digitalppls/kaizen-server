import {Body, Controller, Get, HttpException, HttpStatus, Post, Query, Request} from '@nestjs/common';
import {RequestModel} from "../auth/auth.middleware";
import {Operation} from "./operation.schema";
import {OperationService} from "./operation.service";
import {ListOperationDto} from "./dto/list-operation.dto";
import {ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ListOperationResponse} from "./dto/list-operation.response";
import {Schema, Types} from "mongoose";
import {Exceptions} from "src/enums/exceptions.enum";
import {GetOperationResponse} from "src/operation/dto/get-operation.response";
import {StatOperationDto} from "src/operation/dto/stat-operation.dto";
@ApiTags("📅 Операции")
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
    @ApiOperation({summary:"Получение списка операций текущего пользователя "})
    async list(@Request() req:RequestModel, @Body() dto:ListOperationDto):Promise<ListOperationResponse>{
        return this.operationService.list(req.userId, dto);
    }


    @ApiTags("👨🏻‍💼 Админ")
    @Post("list/other")
    @ApiProperty({type:ListOperationDto})
    @ApiResponse({type:[Operation]})
    @ApiOperation({summary:"Получение списка операций другого пользователя [👨🏻‍💼 ADMIN]"})
    async listOfUser(@Request() req:RequestModel, @Body() dto:ListOperationDto):Promise<ListOperationResponse>{
        if(!dto.userId) throw new HttpException(Exceptions.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        return this.operationService.list(Types.ObjectId(dto.userId), dto);
    }

    @Get("get")
    @ApiQuery({name:"_id", description:"_id операции"})
    @ApiOperation({summary:"Получение операции по _id"})
    async get(@Query("_id") _id:string):Promise<GetOperationResponse>{
        if(!Types.ObjectId(_id)) throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        return {operation: await this.operationService.get(Types.ObjectId(_id))};
    }

    @Post("stat")
    @ApiProperty({type:StatOperationDto})
    @ApiResponse({type:[Operation]})
    @ApiOperation({summary:"Статистика по операциям"})
    async stat(@Request() req:RequestModel, @Body() dto:StatOperationDto):Promise<ListOperationResponse>{
        return this.operationService.stat(dto);
    }

}
