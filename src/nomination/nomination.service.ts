import { HttpException, Injectable } from '@nestjs/common';
import { CreateNominationDto } from './dto/create-nomination.dto';
import { UpdateNominationDto } from './dto/update-nomination.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Nomination, NominationDocument } from './entities/nomination.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HistoriqueService } from 'src/historique/historique.service';
import { TypeEvenement } from 'src/historique/entities/historique.entity';
import { getUserIdFromContext } from 'src/common/request-context';

@Injectable()
export class NominationService extends AbstractModel<Nomination,CreateNominationDto,UpdateNominationDto>{
  constructor(
    @InjectModel(Nomination.name) private readonly nominationModel: Model<NominationDocument>,
    private readonly historiqueService: HistoriqueService,
  ){
    super(nominationModel);
  }

  async create(createDto: CreateNominationDto): Promise<Nomination> {
    const nomination = await super.create(createDto);
    const auteur = getUserIdFromContext();
    await this.historiqueService.create({
      employe: nomination.employe,
      type_evenement: TypeEvenement.NOMINATION,
      description: `Nouvelle nomination à la fonction`,
      details: { nomination },
      auteur,
    });
    return nomination;
  }

  async update(id: string, updateDto: UpdateNominationDto): Promise<Nomination> {
    const nominationAvant = await this.findOne(id);
    const nomination = await super.update(id, updateDto);
    const auteur = getUserIdFromContext();
    await this.historiqueService.create({
      employe: nomination.employe,
      type_evenement: TypeEvenement.NOMINATION,
      description: `Modification de nomination`,
      details: { avant: nominationAvant, apres: nomination },
      auteur,
    });
    return nomination;
  }

  async toggleState(id: string, dto: { est_active: boolean }): Promise<Nomination> {
    const nomination = await this.nominationModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    const typeEvenement = dto.est_active ? TypeEvenement.NOMINATION : TypeEvenement.FIN_NOMINATION;
    const description = dto.est_active ? 'Réactivation de la nomination' : 'Fin de nomination';
    const auteur = getUserIdFromContext();
    await this.historiqueService.create({
      employe: nomination.employe,
      type_evenement: typeEvenement,
      description,
      details: { nomination, etat: dto.est_active },
      auteur,
    });
    return nomination;
  }

  async findByEmploye(emp: string):Promise<Nomination[]> {
    try {
      return this.nominationModel.find({employe: emp});
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }

  async findActiveByEmploye(emp: string):Promise<Nomination[]> {
    try {
      return this.nominationModel.find({employe: emp,est_active: true});
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }

  async deleteByEmploye(employeId: string): Promise<number> {
    try {
      return (await this.nominationModel.deleteMany({ employe: employeId })).deletedCount;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
