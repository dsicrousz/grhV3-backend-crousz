import { IsMongoId, IsString } from "class-validator";

export class CreateServiceDto {
    @IsString()
    nom: string;

    @IsMongoId()
    division: string;
}
