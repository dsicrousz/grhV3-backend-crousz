import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MotifRuptureService } from './motif-rupture.service';
import { CreateMotifRuptureDto } from './dto/create-motif-rupture.dto';
import { UpdateMotifRuptureDto } from './dto/update-motif-rupture.dto';
import { Roles } from 'src/common/guards';

@Controller('motif-rupture')
@Roles('admin', 'rh', 'csa')
export class MotifRuptureController {
    constructor(private readonly motifRuptureService: MotifRuptureService) {}

    @Post()
    create(@Body() createMotifRuptureDto: CreateMotifRuptureDto) {
        return this.motifRuptureService.create(createMotifRuptureDto);
    }

    @Get()
    findAll() {
        return this.motifRuptureService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.motifRuptureService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMotifRuptureDto: UpdateMotifRuptureDto) {
        return this.motifRuptureService.update(id, updateMotifRuptureDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.motifRuptureService.remove(id);
    }
}
