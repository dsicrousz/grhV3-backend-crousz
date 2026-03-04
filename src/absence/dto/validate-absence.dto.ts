import { IsEnum, IsOptional, IsString } from "class-validator";
import { StatutDemande } from "../entities/absence.entity";

export class ValidateAbsenceDto {
    @IsEnum(StatutDemande)
    statut: StatutDemande;

    @IsOptional()
    @IsString()
    commentaire_validation?: string;

    @IsOptional()
    @IsString()
    valide_par?: string;
}
