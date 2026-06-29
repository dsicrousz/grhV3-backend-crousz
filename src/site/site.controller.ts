import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('site')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class SiteController {
    constructor(private readonly siteService: SiteService) {}

    @Post()
    @UserHasPermission({ permission: { site: ['create'] } })
    create(@Body() createSiteDto: CreateSiteDto) {
        return this.siteService.create(createSiteDto);
    }

    @Get()
    @UserHasPermission({ permission: { site: ['list'] } })
    findAll() {
        return this.siteService.findAll();
    }

    @Get(':id')
    @UserHasPermission({ permission: { site: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.siteService.findOne(id);
    }

    @Patch(':id')
    @UserHasPermission({ permission: { site: ['update'] } })
    update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
        return this.siteService.update(id, updateSiteDto);
    }

    @Delete(':id')
    @UserHasPermission({ permission: { site: ['delete'] } })
    remove(@Param('id') id: string) {
        return this.siteService.remove(id);
    }
}
