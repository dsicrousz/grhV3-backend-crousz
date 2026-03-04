import { IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { StatutDemandeConge, TypeConge } from "../entities/conge.entity";

export class CreateCongeDto {
    @IsDateString()
    date_debut: string;

    @IsDateString()
    date_fin: string;

    @IsNumber()
    @Min(1)
    nombre_jours: number;

    @IsEnum(TypeConge)
    type: TypeConge;

    @IsOptional()
    @IsString()
    motif?: string;

    @IsOptional()
    @IsEnum(StatutDemandeConge)
    statut?: StatutDemandeConge;

    @IsMongoId()
    employe: string;
}
