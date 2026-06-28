import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { LotTemporaireService } from './lot-temporaire.service';
import { CreateLotTemporaireDto } from './dto/create-lot-temporaire.dto';
import { UpdateLotTemporaireDto } from './dto/update-lot-temporaire.dto';
import { LotTemporaire } from './entities/lot-temporaire.entity';

import { BulletinTemporaireService } from 'src/bulletin-temporaire/bulletin-temporaire.service';

import { EmployeService } from 'src/employe/employe.service';
import { ContratService } from 'src/contrat/contrat.service';
import { StorageService } from 'src/storage/storage.service';
import { TypeContrat } from 'src/contrat/entities/contrat.entity';

@Controller('lot-temporaire')
export class LotTemporaireController {
    constructor(
        private readonly lotService: LotTemporaireService,
        private readonly bulletinService: BulletinTemporaireService,
        private readonly employeService: EmployeService,
        private readonly contratService: ContratService,
        private readonly storageService: StorageService,
        @InjectQueue('lot-temporaire') private lotQueue: Queue,
    ) {}

    @Post()
    create(@Body() createLotDto: CreateLotTemporaireDto) {
        return this.lotService.createLot(createLotDto);
    }

    @Get()
    findAll() {
     return this.lotService.findAll();     
    }

    @Get('transmis')
    async findAllTransmitted() {
        return this.lotService.findAllTransmitted();
    }

    @Get(':id/detail')
    async findOneWithBulletins(@Param('id') id: string) {
        const lot = await this.lotService.findOneWithBulletins(id);
        if (!lot) {
            throw new HttpException('Lot non trouvé', 404);
        }
        return lot;
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
       return this.lotService.findOne(id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLotDto: UpdateLotTemporaireDto) {
        return this.lotService.update(id, updateLotDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        // Récupérer les bulletins pour avoir les URLs
        const bulletins = await this.bulletinService.findByLot(id);
        // Récupérer le lot pour son URL
        const lot = await this.lotService.findOne(id);
        const lotUrl = lot?.url;

        // Lancer le job de suppression asynchrone
        await this.lotQueue.add('deletelottemporaire', {
            lotId: id,
            lotUrl,
        });

        // Supprimer le lot immédiatement
        return this.lotService.remove(id);
    }

    @Patch('submit/:id')
    async submit(@Param('id') id: string) {
        return this.lotService.submit(id);
    }

    @Patch('cancel-submit/:id')
    async cancelSubmit(@Param('id') id: string) {
        return this.lotService.cancelSubmit(id);
    }

    @Patch('set-waiting/:id')
    async encours(@Param('id') id: string) {
        return this.lotService.encours(id);
    }

    @Patch('cancel-waiting/:id')
    async cancelEncours(@Param('id') id: string) {
        return this.lotService.cancelEncours(id);
    }

    @Patch('validate/:id')
    async validate(@Param('id') id: string) {
        const lot = await this.lotService.validate(id);
        await this.generateBulletin(id);
        return lot;
    }

    @Patch('reject/:id')
    async cancelValidate(@Param('id') id: string) {
        const lot = await this.lotService.cancelValidate(id);
        await this.generateBulletin(id);
        return lot;
    }

    @Patch('transmit/:id')
    transmit(@Param('id') id: string) {
        return this.lotService.transmit(id);
    }

    @Patch('untransmit/:id')
    untransmit(@Param('id') id: string) {
        return this.lotService.untransmit(id);
    }

    @Get('getbulletins/:id')
    async findBulletin(@Param('id') id: string) {
        // Récupérer les bulletins de l'employé depuis la DB
        const bulletins = await this.bulletinService.findByEmploye(id);
        // Filtrer les bulletins publiés et retourner les URLs
        return bulletins.map(b => ({
            lot: b.lot,
            nap: b.nap,
        }));
    }

    // -------------------- GÉNÉRATION DES BULLETINS TEMPORAIRE --------------------

    @Post('generate/:id')
    async generateBulletin(@Param('id') id: string, @Body() body?: { postes?: string[] }) {
        const lot = await this.lotService.findOne(id);
        // Pour les temporaires, pas de bulletins individuels, seulement le bulletin global
        return this.finalizeLotBulletins(lot, body?.postes);
    }

    private async finalizeLotBulletins(lot: LotTemporaire, postesFilter?: string[]) {
        const employes = (await this.employeService.findAllAgregated()).filter((emp) => {
            if (!emp.contrat_actif || emp.contrat_actif.type !== TypeContrat.TEMPORAIRE) return false;
            if (postesFilter?.length) {
                const posteId = emp.contrat_actif.poste?._id?.toString() ?? emp.contrat_actif.poste?.toString();
                return postesFilter.includes(posteId);
            }
            return true;
        });

        const bulletinsData = [];
        for (const emp of employes) {
            const salaireFixe = emp.contrat_actif?.salaire_fixe ?? 0;
            const contrat = await this.contratService.findActiveByEmploye(emp._id.toString());

            await this.bulletinService.updateBulletin(emp._id.toString(), {
                employe: emp._id.toString(),
                lot: lot._id.toString(),
                nap: salaireFixe,
            });

            bulletinsData.push({
                employe: emp,
                contrat_actif: contrat,
                nap: salaireFixe,
            });
        }

        // Generation du PDF global avec tous les bulletins
        try {
            await this.lotQueue.add('generatealltemporaire', { bulletins: bulletinsData, lot });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
        return lot;
    }
}
