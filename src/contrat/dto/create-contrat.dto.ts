import { IsBoolean, IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";
import { TypeContrat } from "../entities/contrat.entity";

export class CreateContratDto {
    @IsEnum(TypeContrat)
    type: TypeContrat;

    @IsDateString()
    date_debut: string;

    @ValidateIf(o => o.type === TypeContrat.CDD || o.type === TypeContrat.TEMPORAIRE)
    @IsDateString()
    date_fin: string;

    @IsMongoId()
    poste: string;

    @ValidateIf(o => o.type === TypeContrat.CDD || o.type === TypeContrat.TEMPORAIRE)
    @IsNumber()
    salaire_fixe: number;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsBoolean()
    est_actif: boolean;

    @ValidateIf(o => o.type === TypeContrat.CDI)
    @IsMongoId()
    categorie: string;

    @ValidateIf(o => o.type === TypeContrat.CDI)
    @IsString()
    matricule_de_solde: string;

    @ValidateIf(o => o.type === TypeContrat.CDI)
    @IsNumber()
    nombre_de_parts: number;

    @IsMongoId()
    employe: string;
}
