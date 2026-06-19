import { IsOptional, IsString } from "class-validator";

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

    @IsString()
    telephone: string;

    @IsString()
    adresse: string;

    @IsString()
    nationalite: string;

    @IsString()
    nci: string;

    @IsOptional()
    @IsString()
    npp: string;

    @IsString()
    genre: string;

    @IsString()
    civilite: string;

    @IsString()
    date_de_naissance: string;

    @IsOptional()
    @IsString()
    lieu_de_naissance: string;

    @IsOptional()
    @IsString()
    profile: string;
}
