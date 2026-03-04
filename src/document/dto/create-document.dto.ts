import { IsNotEmpty, IsString } from "class-validator";

export class CreateDocumentDto {
    @IsNotEmpty()
    @IsString()
    url: string;

    @IsString()
    type: string;

    @IsString()
    nom: string;
}
