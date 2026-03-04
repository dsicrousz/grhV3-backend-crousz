import { IsString } from "class-validator";

export class CreateFonctionDto {
        @IsString()
        nom: string
}
