import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategorieService } from './categorie.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

/**
 * categorie controller CRUD
 *
 * @export
 * @class CategorieController
 * @typedef {CategorieController}
 */
@Controller('categorie')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class CategorieController {
  constructor(private readonly categorieService: CategorieService) {}

  @Post()
  @UserHasPermission({ permission: { categorie: ['create'] } })
  create(@Body() createCategorieDto: CreateCategorieDto) {
    return this.categorieService.create(createCategorieDto);
  }

  @Get()
  @UserHasPermission({ permission: { categorie: ['list'] } })
  findAll() {
    return this.categorieService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { categorie: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.categorieService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { categorie: ['update'] } })
  update(@Param('id') id: string, @Body() updateCategorieDto: UpdateCategorieDto) {
    return this.categorieService.update(id, updateCategorieDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { categorie: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.categorieService.remove(id);
  }
}
