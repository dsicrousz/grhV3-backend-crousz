import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParametreBulletinService } from './parametre-bulletin.service';
import { ParametreBulletinController } from './parametre-bulletin.controller';
import { ParametreBulletin, ParametreBulletinSchema } from './entities/parametre-bulletin.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: ParametreBulletin.name, schema: ParametreBulletinSchema }])],
    controllers: [ParametreBulletinController],
    providers: [ParametreBulletinService],
    exports: [ParametreBulletinService],
})
export class ParametreBulletinModule {}
