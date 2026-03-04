import { IsMongoId, IsString } from "class-validator";

export class CreateExclusionSpecifiqueDto {
    @IsMongoId()
    employe: string;

    @IsMongoId()
    rubrique: string;

    @IsString()
    description: string;
}
