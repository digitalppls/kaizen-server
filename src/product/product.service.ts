import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Model, Types} from "mongoose";
import {ListProductDto} from "./dto/list-product.dto";
import {ListProductResponse} from "./dto/list-product.response";
import {InjectModel} from "@nestjs/mongoose";
import {Product, ProductDocument} from "./product.schema";
import {ApplyProduct, ApplyProductDocument} from "src/product/apply-product.schema";
import {Exceptions} from "src/enums/exceptions.enum";


@Injectable()
export class ProductService {

    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(ApplyProduct.name) private applyProductModel: Model<ApplyProductDocument>
    ) {
    }


    async list(dto: ListProductDto): Promise<ListProductResponse> {
        const filter: any = {};
        const length = await this.productModel.countDocuments(filter)
        const products = await this.productModel.find(filter).sort({date: -1}).skip(dto.offset).limit(dto.limit);
        return {length, offset: dto.offset, limit: dto.limit, products}

    }

    async findByName(name: string): Promise<Product> {
        return this.productModel.findOne({name})
    }

    async get(productId: Types.ObjectId): Promise<Product> {
        return this.productModel.findById(productId);
    }

    async apply(dto: ApplyProduct): Promise<boolean> {
        await this.applyProductModel.create(dto)
        return true;

    }


    async save(p: Product) {
        const values = Object.values(p).filter(x => x);
        console.log(values);
        if (values.length === 0)
            throw new HttpException(Exceptions.CONDITIONS_NOT_MET, HttpStatus.NOT_ACCEPTABLE);
        else if (values.length === 1 && p._id)
            return this.productModel.findByIdAndRemove(p._id);
        else if (p._id)
            return this.productModel.findByIdAndUpdate(p._id, {$set: p});
        else
            return this.productModel.create(p)
    }

}
