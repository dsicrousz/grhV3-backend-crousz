import { Module } from '@nestjs/common';
import { PdfMaker } from './pdf.maker';

@Module({
    providers: [PdfMaker],
    exports: [PdfMaker],
})
export class PdfMakerModule {}
