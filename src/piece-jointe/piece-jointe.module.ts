import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PieceJointeController } from './piece-jointe.controller';
import { PieceJointeService } from './piece-jointe.service';
import { PieceJointe, PieceJointeSchema } from './entities/piece-jointe.entity';
import { StorageService } from 'src/storage/storage.service';
import { S3StorageEngine } from 'src/storage/s3-storage.engine';

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{
            name: PieceJointe.name,
            useFactory: () => {
                const schema = PieceJointeSchema;
                schema.plugin(require('mongoose-autopopulate'));
                return schema;
            }
        }]),
        MulterModule.registerAsync({
            useFactory: (storageService: StorageService) => ({
                storage: storageService.isEnabled()
                    ? new S3StorageEngine(storageService, { prefix: 'documents' })
                    : diskStorage({
                        destination: './uploads/documents',
                        filename: (_req, file, cb) => {
                            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                            const ext = file.originalname.split('.').pop() ?? 'bin';
                            cb(null, `${uniqueSuffix}.${ext}`);
                        },
                    }),
                fileFilter: (_req: any, file: any, cb: any) => {
                    const allowedMimes = [
                        'application/pdf',
                        'image/jpeg',
                        'image/png',
                        'image/gif',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    ];
                    if (allowedMimes.includes(file.mimetype)) {
                        cb(null, true);
                    } else {
                        cb(new Error('Type de fichier non autorisé'), false);
                    }
                },
                limits: {
                    fileSize: 10 * 1024 * 1024, // 10 MB max
                },
            }),
            inject: [StorageService],
        }),
    ],
    controllers: [PieceJointeController],
    providers: [PieceJointeService],
    exports: [PieceJointeService],
})
export class PieceJointeModule {}
