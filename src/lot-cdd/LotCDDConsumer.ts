import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PdfMaker } from 'src/helpers/pdf.maker';
import { BulletinCDDService } from 'src/bulletin-cdd/bulletin-cdd.service';
import { LotCDDService } from './lot-cdd.service';
import { StorageService } from 'src/storage/storage.service';

@Processor('lot-cdd')
export class LotCDDConsumer extends WorkerHost {
    private readonly logger = new Logger(LotCDDConsumer.name);

    constructor(
        private readonly pdf: PdfMaker,
        private readonly bulletinService: BulletinCDDService,
        private readonly lotService: LotCDDService,
        private readonly storageService: StorageService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { name } = job;

        if (name === 'generatebulletincdd') {
            // Generation du PDF individuel
            const { bulletin, lot, contrat } = job.data;
            const url = await this.pdf.makeCDD(bulletin, lot, contrat);
            await this.bulletinService.update(bulletin._id, { url });
            return { url };
        }

        if (name === 'generateallcdd') {
            // Generation du PDF global avec tous les bulletins CDD
            const { bulletins, lot } = job.data;
            const url = await this.pdf.makeAllCdd(bulletins, lot);
            // Mise a jour de l URL du lot
            await this.lotService.update(lot._id, { url });
            return { url };
        }

        if (name === 'deletelotcdd') {
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
            this.logger.log(`Bulletins CDD supprimés pour le lot ${lotId}`);

            return { deleted: true };
        }

        return {};
    }
}
