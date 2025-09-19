import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SubProjectsModule } from './modules/sub-projects/sub-projects.module';
import { ContentTypesModule } from './modules/content-types/content-types.module';
import { ContentsModule } from './modules/contents/contents.module';
import { TextCommandsModule } from './modules/text-commands/text-commands.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProjectsModule,
    SubProjectsModule,
    ContentTypesModule,
    ContentsModule,
    TextCommandsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
