import {Body, Controller, Get, Post} from '@nestjs/common';
import {ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {Throttle} from "@nestjs/throttler";
import {ListStatusResponse} from "src/status/dto/list-status.response";
import {StatusService} from "src/status/status.service";
import {Status} from "src/status/status.schema";

@ApiTags("Status")
@Controller('status')
export class StatusController {


    constructor(
        private readonly statusService: StatusService) {
    }

    @Get("list")
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({summary: "Получение списка возможных статусов", description: ""})
    @Throttle(2, 5)
    @ApiResponse({status: 201, type: ListStatusResponse})
    async statusList(): Promise<ListStatusResponse> {
        return {statuses:await this.statusService.list()};
    }

    @Post("save")
    @ApiBearerAuth()
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiOperation({
        summary: "Добавление/удаление/изменение статусов пользователей",
        description: "Добавление нового статуса в список / или изменение если указан _id на ряду с другими параметрами / или удаление если указан только _id"
    })
    @Throttle(2, 5)
    @ApiResponse({status: 201, type: ListStatusResponse})
    async statusSave(@Body() status: Status): Promise<ListStatusResponse> {
        await this.statusService.save(status);
        return this.statusList();
    }


}
