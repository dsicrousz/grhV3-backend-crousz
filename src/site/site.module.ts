import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { Site, SiteSchema } from './entities/site.entity';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
    ],
    controllers: [SiteController],
    providers: [SiteService],
    exports: [SiteService],
})
export class SiteModule {}
