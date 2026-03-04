import { IsBoolean,IsNumber, IsString } from "class-validator";

export class CreateRubriqueDto {
    @IsString()
     libelle: string;

    @IsNumber()
    code: string;

    @IsString()
    type: string;

    @IsString()
    formule: string;

    @IsNumber()
    taux1: number;

    @IsNumber()
    taux2: number;

    @IsString()
    regle_montant: string;

    @IsString()
    regle_base: string;

    @IsBoolean()
    add_to_brut: boolean;

    @IsBoolean()
    add_to_ipres: boolean;

    @IsNumber()
    ordre: number;
}
