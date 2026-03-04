import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PdfMaker } from './helpers/pdf.maker';
import { BulletinService } from 'src/bulletin/bulletin.service';
@Processor('lot')
export class LotConsumer extends WorkerHost {
    private pdf = new PdfMaker();
  constructor(  
    private readonly bulletinService: BulletinService,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    const {bulletin,olds,lot} = job.data;
    const url = this.pdf.make(bulletin,olds,lot);
    await this.bulletinService.update(bulletin._id,{url});
    return {url};
  }
}