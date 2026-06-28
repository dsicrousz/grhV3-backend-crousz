import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PdfMaker } from 'src/helpers/pdf.maker';
import { BulletinTemporaireService } from 'src/bulletin-temporaire/bulletin-temporaire.service';
import { LotTemporaireService } from './lot-temporaire.service';
import { StorageService } from 'src/storage/storage.service';
import { ParametreBulletinService } from 'src/parametre-bulletin/parametre-bulletin.service';

@Processor('lot-temporaire')
export class LotTemporaireConsumer extends WorkerHost {
    private readonly logger = new Logger(LotTemporaireConsumer.name);

    constructor(
        private readonly pdf: PdfMaker,
        private readonly bulletinService: BulletinTemporaireService,
        private readonly lotService: LotTemporaireService,
        private readonly storageService: StorageService,
        private readonly parametreBulletinService: ParametreBulletinService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { name } = job;

        if (name === 'generatealltemporaire') {
            // Generation du PDF global avec tous les bulletins TEMPORAIRE
            const { bulletins, lot } = job.data;
            const parametre = await this.parametreBulletinService.findByAnnee(lot.annee);
            const couleur = parametre?.couleur ?? '#fac66b';
            const url = await this.pdf.makeAllTemporaire(bulletins, lot, couleur);
            // Mise a jour de l URL du lot
            await this.lotService.update(lot._id, { url });
            return { url };
        }

        if (name === 'deletelottemporaire') {
            const { lotId, bulletinUrls, lotUrl } = job.data;

            // Supprimer les fichiers S3 des bulletins
            if (this.storageService.isEnabled()) {
                for (const url of bulletinUrls) {
                    if (url) {
                        const key = this.storageService.extractKeyFromUrl(url);
                        if (key) {
                            try {
                                await this.storageService.delete(key);
                                this.logger.log(`Fichier supprimé: ${key}`);
                            } catch (err) {
                                this.logger.warn(`Échec suppression ${key}: ${err.message}`);
                            }
                        }
                    }
                }

                // Supprimer le PDF global du lot
                if (lotUrl) {
                    const lotKey = this.storageService.extractKeyFromUrl(lotUrl);
                    if (lotKey) {
                        try {
                            await this.storageService.delete(lotKey);
                            this.logger.log(`PDF lot supprimé: ${lotKey}`);
                        } catch (err) {
                            this.logger.warn(`Échec suppression lot ${lotKey}: ${err.message}`);
                        }
                    }
                }
            }

            // Supprimer les bulletins de la DB
            await this.bulletinService.deleteMany(lotId);
            this.logger.log(`Bulletins temporaires supprimés pour le lot ${lotId}`);

            return { deleted: true };
        }

        return {};
    }
}
