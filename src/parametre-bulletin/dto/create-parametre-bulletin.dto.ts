import { IsInt, IsString, Min } from 'class-validator';

export class CreateParametreBulletinDto {
    @IsInt()
    @Min(2000)
    annee: number;

    @IsString()
    couleur: string;
}
