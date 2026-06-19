import { Module } from '@nestjs/common';
import { BulletinCDDService } from './bulletin-cdd.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BulletinCDD, BulletinCDDSchema } from './entities/bulletin-cdd.entity';
import { BulletinCDDController } from './bulletin-cdd.controller';

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: BulletinCDD.name,
                useFactory: () => {
                    const schema = BulletinCDDSchema;
                    schema.plugin(require('mongoose-autopopulate'));
                    return schema;
                },
            },
        ]),
    ],
    controllers: [BulletinCDDController],
    providers: [BulletinCDDService],
    exports: [BulletinCDDService],
})
export class BulletinCDDModule {}
