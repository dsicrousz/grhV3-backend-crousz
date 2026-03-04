import { IsMongoId, IsNumber, IsOptional} from "class-validator";

export class CreateAttributionFonctionnelleDto {
    @IsMongoId()
    fonction: string;

    @IsMongoId()
    rubrique: string;
    
    @IsOptional()
    @IsNumber()
    valeur_par_defaut: number;
}
