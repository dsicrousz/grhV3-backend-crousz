import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateLotCDDDto {
    @IsString()
    libelle: string;

    @IsString()
    debut: string;

    @IsString()
    fin: string;

    @IsOptional()
    @IsString()
    etat: string;

    @IsOptional()
    @IsBoolean()
    isPublished: boolean;

    @IsOptional()
    @IsString()
    url?: string;
}
