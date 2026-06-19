import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateSiteDto {
    @IsString()
    nom: string;

    @IsOptional()
    @IsString()
    adresse: string;

    @IsOptional()
    @IsString()
    ville: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsBoolean()
    est_actif: boolean;
}
