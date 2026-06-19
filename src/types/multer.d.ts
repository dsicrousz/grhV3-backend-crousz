import { Readable } from 'stream';

declare global {
    namespace Express {
        namespace Multer {
            interface File {
                /** Stream du fichier fourni par Multer pour les StorageEngine personnalisés */
                stream: Readable;
            }
        }
    }
}

export {};
