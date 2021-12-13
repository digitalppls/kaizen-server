import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";
import {AggregateSum, Operation, OperationDocument, OperationStatus, OperationType} from "./operation.schema";
import {CurrencyService} from "../currency/currency.service";
import {Events} from "../socket/events.enum";
import {SocketGateway} from "../socket/socket.gateway";
import {ListOperationDto} from "./dto/list-operation.dto";
import {ListOperationResponse} from "./dto/list-operation.response";
import {Symbol} from "src/currency/currency.schema";

@Injectable()
export class OperationService {
  constructor(
      private readonly socketGateway: SocketGateway,
      @InjectModel(Operation.name) private operationModel: Model<OperationDocument>
  ) {
  }

  async create(
      {amount, symbol, userId, type, targetId}
          : { amount: number, symbol: Symbol, userId: Types.ObjectId, type: OperationType, targetId: Types.ObjectId }, status?: OperationStatus, hash?: string, customerId?:Types.ObjectId, line?:number) {
    const amountUsd = CurrencyService.toUsd(symbol, amount);

    const operation = await this.operationModel.create({
      amount,
      symbol,
      userId,
      type,
      amountUsd,
      targetId,
      status,
      hash,
      customerId,
      line
    })

    this.socketGateway.emitOne(userId, Events.OPERATION_UPDATE, operation)
    return operation;
  }

  async updateOne(filter: any, update: any): Promise<Operation> {
    const operation = await this.operationModel.findOneAndUpdate(filter, update, {new: true})

    this.socketGateway.emitOne(operation.userId, Events.OPERATION_UPDATE, operation)
    return operation;
  }

  async list(userId: Types.ObjectId, dto:ListOperationDto):Promise<ListOperationResponse> {
    const filter:any = { userId };
    if(dto.type && dto.type!==OperationType.ALL) filter.type = dto.type;

    const length = await this.operationModel.countDocuments(filter)
    const operations =  await this.operationModel.find(filter).sort({date:-1}).skip(dto.offset).limit(dto.limit);
    return {length, offset:dto.offset, limit:dto.limit, operations}

  }

    async sumUsd(userIds: Types.ObjectId[], operationTypes: OperationType[]):Promise<AggregateSum[]> {
        const pipline = [
          {$match:{userId: {$in:userIds}, type:{$in:operationTypes}}},
          {$project:{amountUsd:1,userId:1, type:1}},
          {$group:{_id:{type:"$type",userId:"$userId"}, amountUsd:{$sum:"$amountUsd"}}}
        ];
        const aggregate = await this.operationModel.aggregate(pipline);
        console.log(JSON.stringify(pipline),aggregate)
        return aggregate;
    }




  async get(_id: Types.ObjectId):Promise<Operation> {
    return this.operationModel.findById(_id);
  }

  async findCustomersOfOperations(userId: Types.ObjectId, type: OperationType, line?: number):Promise<Types.ObjectId[]> {
    const filter = line?{userId, type, line}:{userId, type};
    return (await this.operationModel.aggregate([
      {$match:filter},
      {$project:{customerId:1}},
      {$group:{_id:"$customerId", customerId:{$first:"$customerId"}}}
    ])).map(x=>x.customerId)
  }

  async sumOfInvests(userIds: Types.ObjectId[]):Promise<number> {
    const aggregate = await this.operationModel.aggregate([{$match:{userId:{$in:userIds},type:OperationType.PACKAGE_BUY, amount:{$lt:0}}},{$group:{_id:null,amountUsd:{$sum:"$amountUsd"}}}]);
    return (aggregate && aggregate[0]) ? aggregate[0].amountUsd :0;
  }
}
