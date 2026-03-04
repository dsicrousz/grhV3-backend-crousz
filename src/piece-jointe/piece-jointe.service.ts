import { HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { CreatePieceJointeDto } from './dto/create-piece-jointe.dto';
import { UpdatePieceJointeDto } from './dto/update-piece-jointe.dto';
import { PieceJointe, PieceJointeDocument, TypePieceJointe } from './entities/piece-jointe.entity';
import { unlinkSync, existsSync } from 'fs';

@Injectable()
export class PieceJointeService extends AbstractModel<PieceJointe, CreatePieceJointeDto, UpdatePieceJointeDto> {
    private readonly logger = new Logger(PieceJointeService.name);

    constructor(
        @InjectModel(PieceJointe.name) private readonly pieceJointeModel: Model<PieceJointeDocument>
    ) {
        super(pieceJointeModel);
    }

    async findByEmploye(employeId: string): Promise<PieceJointe[]> {
        try {
            return this.pieceJointeModel.find({ employe: employeId, est_actif: true } as any).sort({ createdAt: -1 });
        } catch (error) {
            this.logger.error(`Erreur lors de la recherche des pièces jointes pour l'employé ${employeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async findByEmployeAndType(employeId: string, type: TypePieceJointe): Promise<PieceJointe[]> {
        try {
            return this.pieceJointeModel.find({ employe: employeId, type, est_actif: true } as any).sort({ createdAt: -1 });
        } catch (error) {
            this.logger.error(`Erreur lors de la recherche des pièces jointes par type`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async findExpiringSoon(daysBeforeExpiration: number = 30): Promise<PieceJointe[]> {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysBeforeExpiration);
            
            return this.pieceJointeModel.find({
                est_actif: true,
                date_expiration: { $lte: futureDate, $gte: new Date() }
            }).sort({ date_expiration: 1 });
        } catch (error) {
            this.logger.error('Erreur lors de la recherche des documents expirant bientôt', error);
            throw new HttpException(error.message, 500);
        }
    }

    async findExpired(): Promise<PieceJointe[]> {
        try {
            return this.pieceJointeModel.find({
                est_actif: true,
                date_expiration: { $lt: new Date() }
            }).sort({ date_expiration: 1 });
        } catch (error) {
            this.logger.error('Erreur lors de la recherche des documents expirés', error);
            throw new HttpException(error.message, 500);
        }
    }

    async softDelete(id: string): Promise<PieceJointe> {
        try {
            return this.pieceJointeModel.findByIdAndUpdate(id, { est_actif: false }, { new: true });
        } catch (error) {
            this.logger.error(`Erreur lors de la suppression douce de la pièce jointe ${id}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async hardDelete(id: string): Promise<PieceJointe> {
        try {
            const pieceJointe = await this.pieceJointeModel.findById(id);
            if (!pieceJointe) {
                throw new NotFoundException(`Pièce jointe ${id} non trouvée`);
            }

            const filePath = `uploads/documents/${pieceJointe.nom_fichier}`;
            if (existsSync(filePath)) {
                unlinkSync(filePath);
            }

            return this.pieceJointeModel.findByIdAndDelete(id);
        } catch (error) {
            this.logger.error(`Erreur lors de la suppression définitive de la pièce jointe ${id}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async getStatsByEmploye(employeId: string): Promise<{ total: number; parType: Record<string, number> }> {
        try {
            const pieces = await this.pieceJointeModel.find({ employe: employeId, est_actif: true } as any);
            const parType: Record<string, number> = {};
            
            pieces.forEach(p => {
                parType[p.type] = (parType[p.type] || 0) + 1;
            });

            return {
                total: pieces.length,
                parType
            };
        } catch (error) {
            this.logger.error(`Erreur lors du calcul des statistiques pour l'employé ${employeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }
}
