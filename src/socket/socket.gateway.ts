import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import { User, UserDocument } from "../user/user.schema";
import { UnauthorizedException } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { CurrencyService } from "../currency/currency.service";
import { Events } from "./events.enum";
import { Throttle } from "@nestjs/throttler";
import {ApiProperty, ApiTags} from "@nestjs/swagger";


@WebSocketGateway()
export class SocketGateway {

  @WebSocketServer()
  private server: Server;

  constructor(
    private authService: AuthService,

  ) {
  }


  public disconnect(socket: Socket) {
    socket.emit("Error", new UnauthorizedException());
    socket.disconnect();
  }
/*
  @Interval(3000)
  test() {
    this.iterator++;
    console.log(this.iterator);////
    this.server.emit("message", { test: "new" });
    /!*const sids = this.server.sockets.adapter.sids;
    sids.forEach(sid=>this.server.sockets.adapter.socketRooms([...sid].join('')))
   console.log(Array.from(this.server.sockets.sockets.values()).map(x=>x.data));*!/
  }*/

  @Interval(20000)
  sendCurrency(socket?:Socket) {
    const currency = CurrencyService.getCurrency();
    if(socket) this.emitOne(socket, Events.CURRENCY_UPDATE, currency);
    this.emitAll(Events.CURRENCY_UPDATE,currency);
  }


  @Throttle(5,10)
  async handleConnection(socket: Socket) {
    try {
      const decodedToken = await this.authService.verifyJwt(socket.handshake.headers.authorization, socket.handshake.auth?.token);
      // const user: User = await this.userModel.findById(decodedToken._id);
      if (!decodedToken._id) {
        this.sendCurrency(socket)
        return this.disconnect(socket);
      } else {
        socket.data.userId = decodedToken._id;
        this.sendCurrency(socket)
        /*   const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
           // substract page -1 to match the angular material paginator
           rooms.meta.currentPage = rooms.meta.currentPage - 1;
           // Save connection to DB
           await this.connectedUserService.create({ socketId: socket.id, user });
           // Only emit rooms to the specific connected client
           return this.server.to(socket.id).emit('rooms', rooms);*/
      }
    } catch {
      return this.disconnect(socket);
    }
  }


  // @SubscribeMessage("message")
  // handleMessage(@MessageBody() message: string): void {
  //   console.log({ message });
  //   this.emitAll("message", message);
  // }


  emitAll(ev: Events, args: any) {
    this.server.emit(ev, args);
  }

  emitOne(userIdOrSocket: Types.ObjectId | Socket, ev:Events, args: any) {
    if((userIdOrSocket as Socket).client)
      (userIdOrSocket as Socket).emit(ev,args)
    else
      Array.from(this.server.sockets.sockets.values())
      .filter(x => x.data.userId.toString()===userIdOrSocket.toString())
      .forEach((socket) => socket.emit(ev, args))
  }
}
