import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MotifRuptureService } from './motif-rupture.service';
import { CreateMotifRuptureDto } from './dto/create-motif-rupture.dto';
import { UpdateMotifRuptureDto } from './dto/update-motif-rupture.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('motif-rupture')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class MotifRuptureController {
    constructor(private readonly motifRuptureService: MotifRuptureService) {}

    @Post()
    @UserHasPermission({ permission: { motifRupture: ['create'] } })
    create(@Body() createMotifRuptureDto: CreateMotifRuptureDto) {
        return this.motifRuptureService.create(createMotifRuptureDto);
    }

    @Get()
    @UserHasPermission({ permission: { motifRupture: ['list'] } })
    findAll() {
        return this.motifRuptureService.findAll();
    }

    @Get(':id')
    @UserHasPermission({ permission: { motifRupture: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.motifRuptureService.findOne(id);
    }

    @Patch(':id')
    @UserHasPermission({ permission: { motifRupture: ['update'] } })
    update(@Param('id') id: string, @Body() updateMotifRuptureDto: UpdateMotifRuptureDto) {
        return this.motifRuptureService.update(id, updateMotifRuptureDto);
    }

    @Delete(':id')
    @UserHasPermission({ permission: { motifRupture: ['delete'] } })
    remove(@Param('id') id: string) {
        return this.motifRuptureService.remove(id);
    }
}
