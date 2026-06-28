import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PdfMaker } from 'src/helpers/pdf.maker';
import { BulletinService } from 'src/bulletin/bulletin.service';
import { StorageService } from 'src/storage/storage.service';
import { Logger } from '@nestjs/common';
import { ParametreBulletinService } from 'src/parametre-bulletin/parametre-bulletin.service';

@Processor('lot')
export class LotConsumer extends WorkerHost {
  private readonly logger = new Logger(LotConsumer.name);

  constructor(
    private readonly pdf: PdfMaker,
    private readonly bulletinService: BulletinService,
    private readonly storageService: StorageService,
    private readonly parametreBulletinService: ParametreBulletinService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { name } = job;

    if (name === 'generatebulletin') {
      const { bulletin, olds, lot, contrat } = job.data;
      const parametre = await this.parametreBulletinService.findByAnnee(lot.annee);
      const couleur = parametre?.couleur ?? '#fac66b';
      const url = await this.pdf.make(bulletin, olds, lot, contrat, couleur);
      await this.bulletinService.update(bulletin._id, { url });
      return { url };
    }

    if (name === 'deletelot') {
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
      this.logger.log(`Bulletins supprimés pour le lot ${lotId}`);

      return { deleted: true };
    }

    return {};
  }
}