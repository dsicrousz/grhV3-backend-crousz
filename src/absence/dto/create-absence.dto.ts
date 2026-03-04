import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsBoolean } from "class-validator";
import { StatutDemande, TypeAbsence } from "../entities/absence.entity";

export class CreateAbsenceDto {
    @IsDateString()
    date_debut: string;

    @IsDateString()
    date_fin: string;

    @IsEnum(TypeAbsence)
    type: TypeAbsence;

    @IsOptional()
    @IsString()
    motif?: string;

    @IsOptional()
    @IsEnum(StatutDemande)
    statut?: StatutDemande;

    @IsMongoId()
    employe: string;
}
