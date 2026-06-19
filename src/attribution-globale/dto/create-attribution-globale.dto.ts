import { IsMongoId, IsNumber, IsOptional, IsEnum } from "class-validator";
import { TypeContrat } from "src/contrat/entities/contrat.entity";

export class CreateAttributionGlobaleDto {

    @IsMongoId()
    rubrique: string;


    @IsOptional()
    @IsNumber()
    valeur_par_defaut: number;

    @IsEnum(TypeContrat)
    type_contrat: TypeContrat;
}
