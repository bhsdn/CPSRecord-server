import { Module } from '@nestjs/common';
import { SubProjectsController } from './sub-projects.controller';
import { SubProjectsService } from './sub-projects.service';

@Module({
  controllers: [SubProjectsController],
  providers: [SubProjectsService],
  exports: [SubProjectsService],
})
export class SubProjectsModule {}
