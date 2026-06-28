import { IsOptional, IsString } from 'class-validator';

export class CreateMotifRuptureDto {
    @IsString()
    libelle: string;

    @IsOptional()
    @IsString()
    description?: string;
}
