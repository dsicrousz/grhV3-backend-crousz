import { Module } from '@nestjs/common';
import { PosteService } from './poste.service';
import { PosteController } from './poste.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Poste, PosteSchema } from './entities/poste.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Poste.name, schema: PosteSchema }])],
  controllers: [PosteController],
  providers: [PosteService],
})
export class PosteModule {}
