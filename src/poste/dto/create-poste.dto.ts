import { IsString } from "class-validator";

export class CreatePosteDto {
    @IsString()
    nom: string
}
