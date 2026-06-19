import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Site, SiteDocument } from './entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SiteService extends AbstractModel<Site, CreateSiteDto, UpdateSiteDto> {
    constructor(@InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>) {
        super(siteModel);
    }
}
