import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PieceJointeController } from './piece-jointe.controller';
import { PieceJointeService } from './piece-jointe.service';
import { PieceJointe, PieceJointeSchema } from './entities/piece-jointe.entity';

const storage = diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/documents');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split('.').pop();
        cb(null, `doc-${uniqueSuffix}.${ext}`);
    },
});

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
        MulterModule.register({
            storage,
            fileFilter: (req, file, cb) => {
                const allowedMimes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ];
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Type de fichier non autorisé'), false);
                }
            },
            limits: {
                fileSize: 10 * 1024 * 1024 // 10 MB max
            }
        })
    ],
    controllers: [PieceJointeController],
    providers: [PieceJointeService],
    exports: [PieceJointeService]
})
export class PieceJointeModule {}
