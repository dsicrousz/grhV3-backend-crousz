import { IsString } from "class-validator";

export class CreateTypedocumentDto {
    @IsString()
    nom: string;
}
