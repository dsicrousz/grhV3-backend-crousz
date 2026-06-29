import { Controller, Get, Post, Body, Patch, Param, Delete,
   UseInterceptors,UploadedFile,HttpException} from '@nestjs/common';
import { EmployeService } from './employe.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

/**
 * employee controller CRUD 
 *
 * @export
 * @class EmployeController
 * @typedef {EmployeController}
 */
@Controller('employe')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class EmployeController {
  constructor(private readonly employeService: EmployeService) {}


  @Post()
  @UserHasPermission({ permission: { employe: ['create'] } })
  @UseInterceptors(FileInterceptor('profile'))
  create(@UploadedFile() profile: Express.Multer.File,@Body() createEmployeDto: CreateEmployeDto) {
    if(profile){
      createEmployeDto.profile = profile.filename;
    }
    return this.employeService.create(createEmployeDto);
  }

  @Get()
  @UserHasPermission({ permission: { employe: ['list'] } })
  findAll() {
    return this.employeService.findAll();
  }

  @Get("bypointage")
  findAllByPointage() {
    return this.employeService.findAllByPointage();
  }


  @Get("agregated")
  findAllAgregated() {
    return this.employeService.findAllAgregated();
  }

  @Get("bycode/:code")
  findByCode(@Param('code') code: string) {
    return this.employeService.findByCode(code);
  }
  


  @Get("bymatsolde/:mat")
  findByMat(@Param('mat') mat: string) {
    return this.employeService.findByMat(mat);
  }

  @Get(':id')
  @UserHasPermission({ permission: { employe: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.employeService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { employe: ['update'] } })
  update(@Param('id') id: string, @Body() updateEmployeDto: UpdateEmployeDto) {
    return this.employeService.update(id, updateEmployeDto);
  }

  @Patch('profile/:id')
  @UseInterceptors(FileInterceptor('profile'))
  async updateProfile(@UploadedFile() profile: Express.Multer.File,@Param('id') id: string,@Body() updateEmployeDto: UpdateEmployeDto) {
    if(profile){
      updateEmployeDto.profile = profile.filename;
      return this.employeService.update(id,updateEmployeDto);
    }
   throw new HttpException("Profile Non Uploade !!",500);
  }

  @Patch('/toggle/:id')
  toggleState(@Param('id') id: string, @Body() updateStateDto: {is_actif: boolean}) {
    return this.employeService.toggleState(id, updateStateDto);
  }


  @Delete(':id')
  @UserHasPermission({ permission: { employe: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.employeService.remove(id);
  }
}
