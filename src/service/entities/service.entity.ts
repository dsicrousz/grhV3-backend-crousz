import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Division } from "src/division/entities/division.entity";

export type ServiceDocument = HydratedDocument<Service>;

@Schema({timestamps: true})
export class Service {
 @Prop({type: String, required: true})
 nom: string;

 @Prop({type: mongoose.Schema.Types.ObjectId,ref: Division.name,required: true})
 division: string;

 @Prop({type: Boolean, default: true})
 is_active: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);