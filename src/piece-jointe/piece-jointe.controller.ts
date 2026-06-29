import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    UseInterceptors, UploadedFile, HttpException, Query 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PieceJointeService } from './piece-jointe.service';
import { CreatePieceJointeDto } from './dto/create-piece-jointe.dto';
import { UpdatePieceJointeDto } from './dto/update-piece-jointe.dto';
import { TypePieceJointe } from './entities/piece-jointe.entity';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('piece-jointe')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class PieceJointeController {
    constructor(private readonly pieceJointeService: PieceJointeService) {}

    @Post()
    @UserHasPermission({ permission: { pieceJointe: ['create'] } })
    @UseInterceptors(FileInterceptor('fichier'))
    create(
        @UploadedFile() fichier: Express.Multer.File,
        @Body() createPieceJointeDto: CreatePieceJointeDto
    ) {
        if (!fichier) {
            throw new HttpException('Fichier requis', 400);
        }
        
        createPieceJointeDto.nom_fichier = fichier.filename;
        createPieceJointeDto.url = fichier.path;
        createPieceJointeDto.mimetype = fichier.mimetype;
        createPieceJointeDto.taille = fichier.size;
        
        return this.pieceJointeService.create(createPieceJointeDto);
    }

    @Get()
    @UserHasPermission({ permission: { pieceJointe: ['list'] } })
    findAll() {
        return this.pieceJointeService.findAll();
    }

    @Get('employe/:employeId')
    findByEmploye(@Param('employeId') employeId: string) {
        return this.pieceJointeService.findByEmploye(employeId);
    }

    @Get('employe/:employeId/type/:type')
    findByEmployeAndType(
        @Param('employeId') employeId: string,
        @Param('type') type: TypePieceJointe
    ) {
        return this.pieceJointeService.findByEmployeAndType(employeId, type);
    }

    @Get('employe/:employeId/stats')
    getStatsByEmploye(@Param('employeId') employeId: string) {
        return this.pieceJointeService.getStatsByEmploye(employeId);
    }

    @Get('expiring')
    findExpiringSoon(@Query('days') days?: string) {
        return this.pieceJointeService.findExpiringSoon(days ? parseInt(days) : 30);
    }

    @Get('expired')
    findExpired() {
        return this.pieceJointeService.findExpired();
    }

    @Get(':id')
    @UserHasPermission({ permission: { pieceJointe: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.pieceJointeService.findOne(id);
    }

    @Patch(':id')
    @UserHasPermission({ permission: { pieceJointe: ['update'] } })
    @UseInterceptors(FileInterceptor('fichier'))
    async update(
        @Param('id') id: string,
        @UploadedFile() fichier: Express.Multer.File,
        @Body() updatePieceJointeDto: UpdatePieceJointeDto
    ) {
        if (fichier) {
            updatePieceJointeDto.nom_fichier = fichier.filename;
            updatePieceJointeDto.url = fichier.path;
            updatePieceJointeDto.mimetype = fichier.mimetype;
            updatePieceJointeDto.taille = fichier.size;
        }
        return this.pieceJointeService.update(id, updatePieceJointeDto);
    }

    @Delete(':id')
    @UserHasPermission({ permission: { pieceJointe: ['delete'] } })
    softDelete(@Param('id') id: string) {
        return this.pieceJointeService.softDelete(id);
    }

    @Delete(':id/permanent')
    @UserHasPermission({ permission: { pieceJointe: ['delete'] } })
    hardDelete(@Param('id') id: string) {
        return this.pieceJointeService.hardDelete(id);
    }
}
