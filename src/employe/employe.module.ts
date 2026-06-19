import { Module } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { EmployeController } from './employe.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Employe, EmployeSchema } from './entities/employe.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { HistoriqueModule } from 'src/historique/historique.module';
import { StorageService } from 'src/storage/storage.service';
import { S3StorageEngine } from 'src/storage/s3-storage.engine';

@Module({
  imports:[
    MongooseModule.forFeatureAsync([{name: Employe.name,useFactory: () => {
      const schema = EmployeSchema;
      schema.plugin(require('mongoose-autopopulate'));
      return schema;
    }}]),
    MulterModule.registerAsync({
      useFactory: (storageService: StorageService) => ({
        storage: storageService.isEnabled()
          ? new S3StorageEngine(storageService, { prefix: 'profiles' })
          : diskStorage({
              destination: './uploads/profiles',
              filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = file.originalname.split('.').pop() ?? 'bin';
                cb(null, `${uniqueSuffix}.${ext}`);
              },
            }),
      }),
      inject: [StorageService],
    }),
    HistoriqueModule,
  ],
  controllers: [EmployeController],
  providers: [EmployeService],
  exports:[EmployeService]
})
export class EmployeModule {}
