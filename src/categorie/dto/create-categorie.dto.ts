import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class CreateCategorieDto {
    @IsNumber()
    code:number;

    @IsNumber()
    valeur: number;

    @IsOptional()
    @IsBoolean()
    estCadre: boolean;
}
