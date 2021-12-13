import { Module } from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {Status, StatusSchema} from "src/status/status.schema";
import {StatusService} from "src/status/status.service";
import { StatusController } from './status.controller';

@Module({
  imports:[
    MongooseModule.forFeatureAsync([
      { name: Status.name, useFactory: () => StatusSchema }
    ], "cloudDB")
  ],
  providers: [StatusService],
  exports:[StatusService],
  controllers: [StatusController]
})
export class StatusModule {}
