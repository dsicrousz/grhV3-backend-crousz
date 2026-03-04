import { IsMongoId, IsNumber, IsOptional } from "class-validator";

export class CreateAttributionGlobaleDto {
  
    @IsMongoId()
    rubrique: string;


    @IsOptional()
    @IsNumber()
    valeur_par_defaut: number;
}
