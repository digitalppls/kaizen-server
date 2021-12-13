import {CacheKey, CacheTTL, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Model, Types} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";
import {Status, StatusDocument} from "./status.schema";
import {ListStatusResponse} from "./dto/list-status.response";
import {Exceptions} from "src/enums/exceptions.enum";


@Injectable()
export class StatusService {

    constructor(
        @InjectModel(Status.name) private statusModel: Model<StatusDocument>
    ) {
    }

    @CacheTTL(10)
    @CacheKey("statusList")
    async list():Promise<Status[]> {
        const statuses:Status[] =  await this.statusModel.find({}).sort({id:1})
        return statuses;

    }

    async save(status: Status):Promise<Status> {
        const values = Object.values(status).filter(x=>x)
        console.log(values);
        if(values.length===0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if(values.length===1 && status._id)
            return this.statusModel.findByIdAndRemove(status._id);
        else if(status._id)
            return this.statusModel.findByIdAndUpdate(status._id,{$set:status});
        else
            return this.statusModel.create(status)
    }

    async getNextStatusByParams(param: { first_line_invest_usd: number; structure_invest_usd: number; self_invest_usd: number }):Promise<Status> {

        return (await this.list()).find(x=>(x.self_invest_usd > param.self_invest_usd || x.first_line_invest_usd>param.first_line_invest_usd || x.structure_invest_usd>param.structure_invest_usd))

    }

    async getById(id: number):Promise<Status> {
        return (await this.list()).find(x=>x.id===id);
    }
}
