import { IsNumber } from "class-validator";

export class CreateImpotDto {
    @IsNumber()
    vals: number;

    @IsNumber()
    trimf: number;

    @IsNumber()
    p1: number;

    @IsNumber()
    p2: number;

    @IsNumber()
    p3: number;

    @IsNumber()
    p4: number;

    @IsNumber()
    p5: number;

    @IsNumber()
    p6: number;

    @IsNumber()
    p7: number;

    @IsNumber()
    p8: number;

    @IsNumber()
    p9: number;
}
