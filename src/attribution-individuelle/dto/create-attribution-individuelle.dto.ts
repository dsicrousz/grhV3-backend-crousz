import { IsMongoId, IsNumber, IsOptional } from "class-validator";

export class CreateAttributionIndividuelleDto {

    @IsMongoId()
    employe: string;

    @IsMongoId()
    rubrique: string;
    
    @IsOptional()
    @IsNumber()
    valeur_par_defaut: number;
}
