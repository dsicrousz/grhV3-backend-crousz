import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export enum TypeEmploye {
    CDD = "CDD",
    CDI = "CDI"
}

export class CreateEmployeDto {
    @IsString()
    prenom: string;


    @IsOptional()
    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    password: string;


    @IsString()
    nom: string;

    @IsOptional()
    @IsString()
    qualification: string;

    @IsOptional()
    @IsString()
    date_de_fin_de_contrat: string;

    @IsString()
    date_de_recrutement: string;

    @IsString()
    telephone: string;

    @IsString()
    adresse: string;

    @IsString()
    poste: string;

    @IsString()
    nationalite: string;

    @IsString()
    nci: string;

    @IsOptional()
    @IsString()
    npp: string;

    @IsOptional()
    @IsString()
    matricule_de_solde: string;

    @IsString()
    genre: string;

    @IsString()
    civilite: string;

    @IsOptional()
    @IsNumber()
    nombre_de_parts: number;

    @IsOptional()
    @IsNumber()
    mensualite: number;

    @IsString()
    date_de_naissance: string;

    @IsOptional()
    @IsString()
    lieu_de_naissance: string;

    @IsOptional()
    @IsString()
    profile: string;

    @IsOptional()
    @IsMongoId()
    categorie: string;

    @IsEnum(TypeEmploye)
    type: string;

}
