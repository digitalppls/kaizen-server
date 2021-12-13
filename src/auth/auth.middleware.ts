import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";
import { UserService } from "../user/user.service";
import { User, UserPermission } from "../user/user.schema";
import {Types} from "mongoose";
import { Exceptions } from "../enums/exceptions.enum";

export interface RequestModel extends Request {
  userId: Types.ObjectId
}


@Injectable()
export class AuthMiddleware implements NestMiddleware {

  constructor(private authService: AuthService, private userService: UserService) {
  }

  async use(req: RequestModel, res: Response, next: NextFunction) {
    const { pathname } = req["_parsedUrl"];

   console.log({pathname})


    if (!req.headers["authorization"]) throw new HttpException(Exceptions.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    const tokenArray: string[] = req.headers["authorization"].split(" ");
    const decodedToken = await this.authService.verifyJwt(tokenArray[1]);
//    console.log({decodedToken})
    if (!decodedToken || !decodedToken._id) throw new HttpException(Exceptions.INCORRECT_ACCESS_TOKEN, HttpStatus.UNAUTHORIZED);

    // make sure that the user is not deleted, or that props or rights changed compared to the time when the jwt was issued
    const user: User = await this.userService.findOne(decodedToken._id,false);
   // console.log("user",user)
    if (!user) throw new HttpException(Exceptions.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

    /* Доступ запрещен */
    if(Object.values(UserPermission).includes(pathname)){
      if(!user.permissions || !user.permissions.includes(pathname)) throw new HttpException(Exceptions.ACCESS_DENY, HttpStatus.FORBIDDEN)
    }

    req.userId = user._id;
    next();
  }

}
