import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { User } from "../user/user.schema";
import { Types } from "mongoose";

@Injectable()
export class AuthService {

  constructor(private readonly jwtService: JwtService) {
  }

  async generateJwt(user: User): Promise<string> {
    return this.jwtService.signAsync({ email: user.email, password: user.password, _id: user._id });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePasswords(password: string, storedPasswordHash: string): Promise<any> {
    console.log(password, storedPasswordHash)
    console.log(await this.hashPassword(password))
    return bcrypt.compare(password, storedPasswordHash);
  }

  verifyJwt(jwt: string, jwt2?: string): Promise<{ _id: Types.ObjectId, email: string, password: string }> {

    return this.jwtService.verifyAsync(jwt).then(a => {
      return a;
    }).catch(err => {
      return this.jwtService.verifyAsync(jwt2).then(a => {
        return a;
      }).catch(err => {
        console.log("err");
      });
    });


  }

}
