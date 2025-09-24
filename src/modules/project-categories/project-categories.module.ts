import { Module } from '@nestjs/common';
import { ProjectCategoriesController } from './project-categories.controller';
import { ProjectCategoriesService } from './project-categories.service';

@Module({
  controllers: [ProjectCategoriesController],
  providers: [ProjectCategoriesService],
  exports: [ProjectCategoriesService],
})
export class ProjectCategoriesModule {}
