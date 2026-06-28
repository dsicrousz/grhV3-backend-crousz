import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { MotifRupture, MotifRuptureDocument } from './entities/motif-rupture.entity';
import { CreateMotifRuptureDto } from './dto/create-motif-rupture.dto';
import { UpdateMotifRuptureDto } from './dto/update-motif-rupture.dto';

@Injectable()
export class MotifRuptureService extends AbstractModel<MotifRupture, CreateMotifRuptureDto, UpdateMotifRuptureDto> {
    constructor(@InjectModel(MotifRupture.name) private readonly motifRuptureModel: Model<MotifRuptureDocument>) {
        super(motifRuptureModel);
    }
}
