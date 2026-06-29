import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface UploadedFile {
    key: string;
    url: string;
    bucket: string;
    mimetype: string;
    size: number;
    etag?: string;
}

export interface StorageConfig {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    publicUrl?: string;
    forcePathStyle: boolean;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private client: S3Client;
    private config: StorageConfig;

    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
        const region = this.configService.get<string>('STORAGE_REGION', 'auto');
        const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('STORAGE_SECRET_ACCESS_KEY');
        const bucket = this.configService.get<string>('STORAGE_BUCKET');
        const publicUrl = this.configService.get<string>('STORAGE_PUBLIC_URL', '');
        const forcePathStyle = this.configService.get<string>('STORAGE_FORCE_PATH_STYLE', 'true') === 'true';

        this.config = { endpoint: endpoint || '', region, accessKeyId: accessKeyId || '', secretAccessKey: secretAccessKey || '', bucket: bucket || '', publicUrl, forcePathStyle };

        if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
            this.logger.warn(
                'Configuration S3 incomplète. Le stockage objet est désactivé. ' +
                'Définissez STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY et STORAGE_BUCKET.',
            );
            return;
        }

        this.client = new S3Client({
            endpoint,
            region,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle,
        });

        this.logger.log(`StorageService initialisé → ${endpoint} / bucket: ${bucket}`);
    }

    isEnabled(): boolean {
        return !!this.client;
    }

    /**
     * Extrait la clé S3 d'une URL complète
     * Ex: https://pub-xxx.r2.dev/bulletins/123.pdf → bulletins/123.pdf
     */
    extractKeyFromUrl(url: string): string | null {
        if (!url) return null;

        try {
            const urlObj = new URL(url);
            // Enlever le leading slash du pathname
            let key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

            // Si path-style (endpoint/bucket/key), enlever le bucket du début
            if (this.config?.bucket && key.startsWith(this.config.bucket + '/')) {
                key = key.slice(this.config.bucket.length + 1);
            }

            return key || null;
        } catch {
            // Si ce n'est pas une URL valide, c'est peut-être déjà une clé ou un chemin local
            // Enlever le préfixe uploads/ si présent
            if (url.startsWith('uploads/')) {
                return url.slice('uploads/'.length);
            }
            return url;
        }
    }

    getClient(): S3Client | null {
        return this.client ?? null;
    }

    getConfig(): StorageConfig | null {
        return this.config ?? null;
    }

    async upload(
        key: string,
        body: Buffer | Readable | Uint8Array | string,
        mimetype: string,
    ): Promise<UploadedFile> {
        this.ensureEnabled();

        const input: PutObjectCommandInput = {
            Bucket: this.config.bucket,
            Key: key,
            Body: body,
            ContentType: mimetype,
        };

        try {
            const upload = new Upload({ client: this.client, params: input });
            const result = await upload.done();

            this.logger.log(`Fichier uploadé : ${key} (${mimetype})`);
            return {
                key,
                url: key,
                bucket: result.Bucket ?? this.config.bucket,
                mimetype,
                size: 0,
                etag: result.ETag,
            };
        } catch (error) {
            this.logger.error(`Échec upload S3 : ${key}`, error);
            throw error;
        }
    }

    async delete(key: string): Promise<void> {
        this.ensureEnabled();

        try {
            await this.client.send(
                new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
            );
            this.logger.log(`Fichier supprimé : ${key}`);
        } catch (error) {
            this.logger.error(`Échec suppression S3 : ${key}`, error);
            throw error;
        }
    }

    async exists(key: string): Promise<boolean> {
        this.ensureEnabled();

        try {
            await this.client.send(
                new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }),
            );
            return true;
        } catch {
            return false;
        }
    }

    async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        this.ensureEnabled();

        return getSignedUrl(
            this.client,
            new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
            { expiresIn: expiresInSeconds },
        );
    }

    async getObject(key: string): Promise<{ body: Readable; mimetype: string; size: number }> {
        this.ensureEnabled();

        const result = await this.client.send(
            new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
        );

        return {
            body: result.Body as Readable,
            mimetype: result.ContentType ?? 'application/octet-stream',
            size: result.ContentLength ?? 0,
        };
    }

    async listObjects(prefix: string): Promise<{ key: string; size: number; lastModified: Date }[]> {
        this.ensureEnabled();

        const result = await this.client.send(
            new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: prefix }),
        );

        return (result.Contents ?? []).map((obj) => ({
            key: obj.Key ?? '',
            size: obj.Size ?? 0,
            lastModified: obj.LastModified ?? new Date(),
        }));
    }

    buildUrl(key: string): string {
        if (this.config.publicUrl) {
            const base = this.config.publicUrl.replace(/\/$/, '');
            return `${base}/${key}`;
        }
        const endpoint = this.config.endpoint.replace(/\/$/, '');
        return `${endpoint}/${this.config.bucket}/${key}`;
    }

    /**
     * Reconstruit l'URL complète à partir d'une clé ou d'un chemin relatif
     * Si la valeur est déjà une URL complète, elle est retournée telle quelle
     */
    getPublicUrl(keyOrUrl: string): string {
        if (!keyOrUrl) return '';
        
        // Si c'est déjà une URL complète (commence par http:// ou https://)
        if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
            return keyOrUrl;
        }
        
        // Si c'est un chemin local (commence par uploads/)
        if (keyOrUrl.startsWith('uploads/')) {
            return keyOrUrl;
        }
        
        // Sinon, c'est une clé S3, on construit l'URL complète
        return this.buildUrl(keyOrUrl);
    }

    private ensureEnabled(): void {
        if (!this.client) {
            throw new Error(
                'StorageService non configuré. Vérifiez les variables STORAGE_* dans .env',
            );
        }
    }
}
