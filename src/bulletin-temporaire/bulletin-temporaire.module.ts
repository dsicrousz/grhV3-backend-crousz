import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BulletinTemporaireService } from './bulletin-temporaire.service';
import { BulletinTemporaireController } from './bulletin-temporaire.controller';
import { BulletinTemporaire, BulletinTemporaireSchema } from './entities/bulletin-temporaire.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: BulletinTemporaire.name, schema: BulletinTemporaireSchema }])],
    controllers: [BulletinTemporaireController],
    providers: [BulletinTemporaireService],
    exports: [BulletinTemporaireService],
})
export class BulletinTemporaireModule {}
