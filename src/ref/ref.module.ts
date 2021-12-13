import { Module } from '@nestjs/common';
import { RefService } from './ref.service';
import { RefController } from './ref.controller';
import {UserModule} from "src/user/user.module";
import {OperationModule} from "src/operation/operation.module";

@Module({
  imports:[UserModule, OperationModule],
  providers: [RefService],
  controllers: [RefController]
})
export class RefModule {}
