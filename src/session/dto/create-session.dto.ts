import { IsString } from "class-validator";

export class CreateSessionDto {
        @IsString()
        nom: string
}
