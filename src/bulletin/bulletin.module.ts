import { Module } from '@nestjs/common';
import { BulletinService } from './bulletin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Bulletin, bulletinSchema } from './entities/bulletin.entity';
import { BulletinController } from './bulletin.controller';
@Module({
  imports:[MongooseModule.forFeatureAsync([{name: Bulletin.name,useFactory:()=> {
    const schema = bulletinSchema;
    schema.plugin(require('mongoose-autopopulate'));
    return schema;
  }}])],
  controllers:[BulletinController],
  providers: [BulletinService],
  exports: [BulletinService]
})
export class BulletinModule {}
