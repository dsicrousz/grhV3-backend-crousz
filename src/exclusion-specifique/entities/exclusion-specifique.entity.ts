import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";
import { Rubrique } from "src/rubrique/entities/rubrique.entity";

export type ExclusionSpecifiqueDocument = HydratedDocument<ExclusionSpecifique>;

@Schema({timestamps: true})
export class ExclusionSpecifique {

    _id: string;

    @Prop({type: Types.ObjectId,ref: Employe.name,required: true,autopopulate: true})
    employe: string;

    @Prop({type: Types.ObjectId,ref: Rubrique.name,required: true,autopopulate: true})
    rubrique:Rubrique ;

    @Prop({type: String})
    description: string;
}

export const ExclusionSpecifiqueSchema = SchemaFactory.createForClass(ExclusionSpecifique).index({'employe': 1, 'rubrique': 1}, {unique: true});;
