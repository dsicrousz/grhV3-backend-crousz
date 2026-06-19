import { IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { Figuration } from 'src/figuration/entities/figuration.entity';

export class CreateBulletinTemporaireDto {
    @IsMongoId()
    employe: string;

    @IsMongoId()
    lot: string;

    lignes?: { gains: Figuration[]; retenues: Figuration[] };

    @IsOptional()
    @IsNumber()
    totalIm?: number;

    @IsOptional()
    @IsNumber()
    totalNI?: number;

    @IsOptional()
    @IsNumber()
    totalRet?: number;

    @IsOptional()
    @IsNumber()
    totalPP?: number;

    @IsOptional()
    @IsNumber()
    nap?: number;

    @IsOptional()
    url?: string;
}
