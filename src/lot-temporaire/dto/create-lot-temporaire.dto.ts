import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateLotTemporaireDto {
    @IsString()
    libelle: string;

    @IsString()
    debut: string;

    @IsString()
    fin: string;

    @IsOptional()
    @IsString()
    etat: string;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsString()
    @IsOptional()
    url?: string;
}
