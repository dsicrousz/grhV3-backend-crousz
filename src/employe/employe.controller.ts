import { Controller, Get, Post, Body, Patch, Param, Delete,
   UseInterceptors,UploadedFile,HttpException, UnauthorizedException, HttpCode} from '@nestjs/common';
import { EmployeService } from './employe.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, unlinkSync } from 'fs';

/**
 * employee controller CRUD 
 *
 * @export
 * @class EmployeController
 * @typedef {EmployeController}
 */
@Controller('employe')
export class EmployeController {
  constructor(private readonly employeService: EmployeService) {}


  @Post()
  @UseInterceptors(FileInterceptor('profile'))
  create(@UploadedFile() profile: Express.Multer.File,@Body() createEmployeDto: CreateEmployeDto) {
    if(profile){
      createEmployeDto.profile  = profile.filename;
    }
    return this.employeService.create(createEmployeDto);
  }

  
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: {code:string,pass:string}){
    const employe = await this.employeService.findByCode(loginDto.code);
    if(!employe || employe.password !== loginDto.pass){
      throw new UnauthorizedException();
    }
    return employe;
  }

  @Get()
  findAll() {
    return this.employeService.findAllCdi();
  }

  @Get("bypointage")
  findAllByPointage() {
    return this.employeService.findAllByPointage();
  }

  @Get("cdds")
  findAllCdd() {
    return this.employeService.findAllCdd();
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
  findOne(@Param('id') id: string) {
    return this.employeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeDto: UpdateEmployeDto) {
    return this.employeService.update(id, updateEmployeDto);
  }

  @Patch('updatepassword/:id')
  updatePassword(@Param('id') id: string, @Body() updatepass: {oldPass: string,newPass: string}) {
    return this.employeService.updatePassword(id, updatepass);
  }

  @Patch('profile/:id')
  @UseInterceptors(FileInterceptor('profile'))
  async updateProfile(@UploadedFile() profile: Express.Multer.File,@Param('id') id: string,@Body() updateEmployeDto: UpdateEmployeDto) {
    if(profile){
      updateEmployeDto.profile  = profile.filename;
      const em = await this.employeService.update(id,updateEmployeDto);
      if(em && existsSync("uploads/profiles/" + em.profile)){
        unlinkSync("uploads/profiles/" + em.profile);
      }
      return em;
    }
   throw new HttpException("Profile Non Uploade !!",500);
  }

  @Patch('/toggle/:id')
  toggleState(@Param('id') id: string, @Body() updateStateDto: {is_actif: boolean}) {
    return this.employeService.toggleState(id, updateStateDto);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeService.remove(id);
  }
}
