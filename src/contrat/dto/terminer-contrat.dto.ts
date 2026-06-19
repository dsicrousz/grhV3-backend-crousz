import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { MotifTerminaison } from '../entities/contrat.entity';

export class TerminerContratDto {
    @IsEnum(MotifTerminaison)
    motif_terminaison: MotifTerminaison;

    @IsOptional()
    @IsDateString()
    date_fin?: string;
}
