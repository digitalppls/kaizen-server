import { Module } from '@nestjs/common';
import { OperationService } from './operation.service';
import { MongooseModule } from "@nestjs/mongoose";
import { Operation, OperationSchema } from "./operation.schema";
import {SocketModule} from "src/socket/socket.module";
import { OperationController } from './operation.controller';

@Module({
  imports:[
      SocketModule,
    MongooseModule.forFeatureAsync([
      { name: Operation.name, useFactory: () => OperationSchema }
    ], "cloudDB")
  ],
  providers: [OperationService],
  exports: [OperationService],
  controllers: [OperationController]
})
export class OperationModule {}
