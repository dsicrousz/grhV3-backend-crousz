import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MotifRuptureService } from './motif-rupture.service';
import { MotifRuptureController } from './motif-rupture.controller';
import { MotifRupture, MotifRuptureSchema } from './entities/motif-rupture.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: MotifRupture.name, schema: MotifRuptureSchema }])],
    controllers: [MotifRuptureController],
    providers: [MotifRuptureService],
    exports: [MotifRuptureService],
})
export class MotifRuptureModule {}
