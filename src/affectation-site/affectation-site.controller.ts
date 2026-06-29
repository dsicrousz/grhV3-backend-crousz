import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AffectationSiteService } from './affectation-site.service';
import { CreateAffectationSiteDto } from './dto/create-affectation-site.dto';
import { UpdateAffectationSiteDto } from './dto/update-affectation-site.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('affectation-site')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class AffectationSiteController {
    constructor(private readonly affectationSiteService: AffectationSiteService) {}

    @Post()
    @UserHasPermission({ permission: { affectation: ['create'] } })
    create(@Body() createDto: CreateAffectationSiteDto) {
        return this.affectationSiteService.create(createDto);
    }

    @Get()
    @UserHasPermission({ permission: { affectation: ['list'] } })
    findAll() {
        return this.affectationSiteService.findAll();
    }

    @Get('by-employe/:employeId')
    findByEmploye(@Param('employeId') employeId: string) {
        return this.affectationSiteService.findByEmploye(employeId);
    }

    @Get('active/:employeId')
    findActiveByEmploye(@Param('employeId') employeId: string) {
        return this.affectationSiteService.findActiveByEmploye(employeId);
    }

    @Get('by-site/:siteId')
    findBySite(@Param('siteId') siteId: string) {
        return this.affectationSiteService.findBySite(siteId);
    }

    @Get('by-division/:divisionId')
    findByDivision(@Param('divisionId') divisionId: string) {
        return this.affectationSiteService.findByDivision(divisionId);
    }

    @Get('by-service/:serviceId')
    findByService(@Param('serviceId') serviceId: string) {
        return this.affectationSiteService.findByService(serviceId);
    }

    @Get('stats/by-division')
    countByDivision() {
        return this.affectationSiteService.countByDivision();
    }

    @Get('stats/by-service')
    countByService() {
        return this.affectationSiteService.countByService();
    }

    @Get(':id')
    @UserHasPermission({ permission: { affectation: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.affectationSiteService.findOne(id);
    }

    @Patch(':id')
    @UserHasPermission({ permission: { affectation: ['update'] } })
    update(@Param('id') id: string, @Body() updateDto: UpdateAffectationSiteDto) {
        return this.affectationSiteService.update(id, updateDto);
    }

    @Patch('terminer/:id')
    terminer(@Param('id') id: string) {
        return this.affectationSiteService.terminer(id);
    }

    @Delete(':id')
    @UserHasPermission({ permission: { affectation: ['delete'] } })
    remove(@Param('id') id: string) {
        return this.affectationSiteService.remove(id);
    }
}
