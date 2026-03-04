import { IsMongoId, IsOptional, IsString } from "class-validator";

export class CreateDivisionDto {
    @IsString()
    nom: string;

    @IsMongoId()
    @IsOptional()
    parent: string;
}
