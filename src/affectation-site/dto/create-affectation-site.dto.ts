import { IsBoolean, IsDateString, IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateAffectationSiteDto {
    @IsMongoId()
    employe: string;

    @IsMongoId()
    site: string;

    @IsOptional()
    @IsMongoId()
    division: string;

    @IsOptional()
    @IsMongoId()
    service: string;

    @IsDateString()
    date_debut: string;

    @IsOptional()
    @IsDateString()
    date_fin: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsBoolean()
    est_active: boolean;
}
