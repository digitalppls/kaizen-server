import {Injectable} from '@nestjs/common';
import {Types} from "mongoose";
import {UserService} from "src/user/user.service";
import {User} from "src/user/user.schema";
import {OperationService} from "src/operation/operation.service";
import {OperationType} from "src/operation/operation.schema";
import {ListRefResponse} from "src/ref/dto/list-ref.response";

@Injectable()
export class RefService {


    constructor(
        private readonly userService:UserService,
        private readonly operationService:OperationService
    ) {
    }

    async list(myId: Types.ObjectId, userId: Types.ObjectId, line: number):Promise<ListRefResponse> {
        const users: User[] = await this.userService.refLine(myId, userId, line);
        const allStructureIds: Types.ObjectId[] = await this.userService.childsIds([userId,...users.map(x=>x._id)]);
        const aggregateSums = await this.operationService.sumUsd(allStructureIds, [OperationType.PACKAGE_BUY, OperationType.PRODUCT_BUY])

        return {users,aggregateSums}
    }
}
