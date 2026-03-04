import { IsMongoId, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateBulletinDto {
    @IsMongoId()
    employe: string;

    @IsMongoId()
    lot: string;

    @IsObject()
    lignes: object;

    @IsNumber()
    totalIm: number;

    @IsNumber()
    totalNI: number;

    @IsNumber()
    totalRet: number;

    @IsNumber()
    totalPP: number;

    @IsNumber()
    nap: number;

    @IsOptional()
    @IsString()
    url?: string;
}
