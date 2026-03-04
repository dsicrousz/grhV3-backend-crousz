import { IsEnum, IsOptional, IsString } from "class-validator";
import { StatutDemandeConge } from "../entities/conge.entity";

export class ValidateCongeDto {
    @IsEnum(StatutDemandeConge)
    statut: StatutDemandeConge;

    @IsOptional()
    @IsString()
    commentaire_validation?: string;

    @IsOptional()
    @IsString()
    valide_par?: string;
}
