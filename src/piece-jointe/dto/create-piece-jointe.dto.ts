import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
import { TypePieceJointe } from "../entities/piece-jointe.entity";

export class CreatePieceJointeDto {
    @IsString()
    nom: string;

    @IsOptional()
    @IsString()
    nom_fichier?: string;

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsString()
    mimetype?: string;

    @IsOptional()
    taille?: number;

    @IsEnum(TypePieceJointe)
    type: TypePieceJointe;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    date_document?: string;

    @IsOptional()
    @IsDateString()
    date_expiration?: string;

    @IsMongoId()
    employe: string;

    @IsOptional()
    @IsString()
    ajoute_par?: string;
}
