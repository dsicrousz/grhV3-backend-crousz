import { IsEnum, IsMongoId, IsObject, IsOptional, IsString } from "class-validator";
import { TypeEvenement } from "../entities/historique.entity";

export class CreateHistoriqueDto {
    @IsMongoId()
    employe: string;

    @IsEnum(TypeEvenement)
    type_evenement: TypeEvenement;

    @IsString()
    description: string;

    @IsOptional()
    @IsObject()
    details: Record<string, any>;

    @IsOptional()
    @IsString()
    auteur: string;
}
