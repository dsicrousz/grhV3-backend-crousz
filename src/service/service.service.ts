import { HttpException, Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Service, ServiceDocument } from './entities/service.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ServiceService  extends AbstractModel<Service,CreateServiceDto,UpdateServiceDto>{
  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>){
    super(serviceModel);
  }

  async findByDivision(id: string): Promise<Service[]> {
    try {
      return this.serviceModel.find({division: id})
    } catch (error) {
      throw new HttpException(error.message,500);
    }
    
  }
}
