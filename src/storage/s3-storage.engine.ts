import { StorageEngine } from 'multer';
import { StorageService } from './storage.service';
import { Readable, Transform, TransformCallback } from 'stream';
import { Logger } from '@nestjs/common';

/**
 * Stream wrapper qui compte les bytes qui passent
 */
class ByteCounter extends Transform {
    private bytes = 0;

    _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
        this.bytes += chunk.length;
        callback(null, chunk);
    }

    getByteCount(): number {
        return this.bytes;
    }
}

export interface S3StorageOptions {
    prefix?: string;
    acl?: string;
}

/**
 * Moteur de stockage Multer compatible S3.
 *
 * Remplace diskStorage : au lieu d'écrire sur disque,
 * les fichiers sont streamés directement vers le bucket S3.
 */
export class S3StorageEngine implements StorageEngine {
    private readonly logger = new Logger(S3StorageEngine.name);

    constructor(
        private readonly storageService: StorageService,
        private readonly options: S3StorageOptions = {},
    ) {
        this.logger.log(`S3StorageEngine créé avec prefix: ${options.prefix ?? 'uploads'}`);
    }

    _handleFile(
        _req: any,
        file: Express.Multer.File,
        cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
    ): void {
        const prefix = this.options.prefix ?? 'uploads';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split('.').pop() ?? 'bin';
        const key = `${prefix}/${uniqueSuffix}.${ext}`;

        this.logger.log(`Upload démarré: ${key} (${file.originalname}, ${file.mimetype})`);

        // Multer fournit file.stream (Readable) pour les StorageEngine personnalisés
        const sourceStream = file.stream ?? Readable.from([file.buffer]);
        const byteCounter = new ByteCounter();
        const countedStream = sourceStream.pipe(byteCounter);

        this.storageService
            .upload(key, countedStream, file.mimetype)
            .then((uploaded) => {
                const size = byteCounter.getByteCount();
                this.logger.log(`Upload réussi: ${key} → ${uploaded.url} (${size} bytes)`);
                cb(null, {
                    filename: key,
                    path: uploaded.url,
                    size: size,
                    mimetype: file.mimetype,
                });
            })
            .catch((err) => {
                this.logger.error(`Upload échoué: ${key}`, err);
                cb(err);
            });
    }

    _removeFile(
        _req: any,
        file: Express.Multer.File,
        cb: (error: Error | null) => void,
    ): void {
        const key = file.filename;
        this.storageService
            .delete(key)
            .then(() => cb(null))
            .catch((err) => cb(err));
    }
}
