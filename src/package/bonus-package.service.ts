import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Exceptions} from "src/enums/exceptions.enum";
import {User} from "src/user/user.schema";
import {Operation, OperationType} from "src/operation/operation.schema";
import {UserService} from "src/user/user.service";
import {StatusService} from "src/status/status.service";
import {BonusPackage, BonusPackageDocument} from "src/package/bonus-package.schema";

@Injectable()
export class BonusPackageService {
    constructor(
        private readonly userService: UserService,
        private readonly statusService: StatusService,
        @InjectModel(BonusPackage.name) private packageBonusModel: Model<BonusPackageDocument>,
    ) {
    }


    async list(): Promise<BonusPackage[]> {
        return this.packageBonusModel.find({}).sort({line: 1});
    }

    async save(bonus: BonusPackage) {
        const values = Object.values(bonus).filter(x => x);
        console.log(values);
        if (values.length === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (values.length === 1 && bonus._id)
            return this.packageBonusModel.findByIdAndRemove(bonus._id);
        else if (bonus._id)
            return this.packageBonusModel.findByIdAndUpdate(bonus._id, {$set: bonus});
        else
            return this.packageBonusModel.create(bonus)
    }

    async send(user: User, operations: Operation[]): Promise<User[]> {
        const fathers: User[] = [];
        // LinearBonus / Награждаем вышестоящих линейным бонусом + за статус
        const pakcageBonuses = await this.list();
        const fathersStatuses = await this.userService.listUserFatherStatuses(user);
        for (let L = 0; L < pakcageBonuses.length; L++) {
            if (user.fathers.length > L) {
                for (let operation of operations) {
                    const fatherStatusId = fathersStatuses.find(x => x._id + '' === '' + user.fathers[L]).status;
                    const fatherStatus = await this.statusService.getById(fatherStatusId)
                    let amount = Math.abs(operation.amount) * (pakcageBonuses[L].percent + (fatherStatus ? fatherStatus.package_bonus_add_percent : 0)) / 100;
                    const fatherBonus = await this.userService.walletIncrement(
                        user.fathers[L],
                        operation.symbol,
                        amount,
                        OperationType.PACKAGE_REF_BONUS,
                        operation._id,
                        undefined, undefined, user._id, true, L + 1
                    );
                    fathers.push(fatherBonus.user);
                }
            }
        }
        return fathers;
    }


}
