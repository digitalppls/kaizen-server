import request from 'supertest';
import {Logger} from "@nestjs/common";
import {Symbol} from "../src/currency/currency.schema";
import {LimitOrderDirection} from "../src/token/limit-order/limit-order.schema";
const url = "http://localhost:3004"

enum Method{
    post= "post",
    get= "get"
}

describe("Limit Order", ()=> {


    let user = {
        name: "User1",
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1haWx0ZXJAbWFpbC5ydSIsInBhc3N3b3JkIjoiJDJiJDEyJHRpazh0Z1FJc1U1TnJDaVlmM3cvNHU2VURJNXlrY1hhNXB6eUswMTF4WmxlNFM3emNYcUhXIiwiX2lkIjoiNjI5ZmZlM2QzNzA0YzkzYjk5NjhjYzI0IiwiaWF0IjoxNjU1MTI5NDYwLCJleHAiOjI1MTkxMjk0NjB9.gi8rqOP3MU82MXVc4L_QH6PxTXB_S5hBLk9Rl_DvlOI',
        user: undefined
    };


    function getUser(){
        return request(url)
            .post("/api/user/get")
            .set("Accept", "application/json").set('Authorization', 'bearer ' + user.token)
            .send({}).expect(201)
            .then((response) => {
                user.user = response.body.user;
                Logger.log(response.body.user.wallets.map(x=>x.symbol+": "+x.amount).join(", "))
            })
    }


    it('Get User',  () => {
       return getUser();
    })

    // it("limit order, and check balance ", ()=>{
    //     return request(url)
    //         .post("/api/token/limit-order/buy/save")
    //         .set("Accept", "application/json").set('Authorization', 'bearer ' + user.token)
    //         // .send({ _id:("62ba27ca6aedc93f61973f2b")}).send({}).expect(201)
    //         .send({_id:("62ba27d86aedc93f61973f3b"), userId:user.user._id, priceUsd:10, direction:LimitOrderDirection.BUY, symbol:Symbol.KZN, amount:5}).send({}).expect(201)
    //         .then((response) => {
    //             Logger.log(response.body)
    //         })
    // })

    let sellId;
    it("sell limit order ", ()=>{
        return request(url)
            .post("/api/token/limit-order/sell/save")
            .set("Accept", "application/json").set('Authorization', 'bearer ' + user.token)
            // .send({ _id:("62ba27ca6aedc93f61973f2b")}).send({}).expect(201)
            .send({ userId:user.user._id, priceUsd:5, direction:LimitOrderDirection.SELL, symbol:Symbol.KZN, amount:10}).send({}).expect(201)
            .then((response) => {
                sellId =  response.body[0]._id
            })
    })


    it("buy limit order ", ()=>{
        return request(url)
            .post("/api/token/limit-order/buy/save")
            .set("Accept", "application/json").set('Authorization', 'bearer ' + user.token)
            // .send({ _id:("62ba27ca6aedc93f61973f2b")}).send({}).expect(201)
            .send({ userId:user.user._id, priceUsd:5, direction:LimitOrderDirection.BUY, symbol:Symbol.KZN, amount:5}).send({}).expect(201)
            .then((response) => {

            })
    })
/*
    it("sell limit order change price ", ()=>{
        console.log("sellId",sellId)
        return request(url)
            .post("/api/token/limit-order/sell/save")
            .set("Accept", "application/json").set('Authorization', 'bearer ' + user.token)
            // .send({ _id:("62ba27ca6aedc93f61973f2b")}).send({}).expect(201)
            .send({ _id:sellId, priceUsd:5}).send({}).expect(201)
            .then((response) => {})
    })
*/


    // it("limit order delete", ()=>{
    //     return request(url)
    //         .post("/api/token/limit-order/sell/save")
    //         .set("Accept", "application/json").set('Authorization', 'bearer ' + user.token)
    //         .send({_id:'62ba207729d79d391ea441f6'}).send({}).expect(201)
    //         .then((response) => {
    //             Logger.log(response.body)
    //         })
    // })


    it('Get User Again',  () => {
        return getUser();
    })
})
