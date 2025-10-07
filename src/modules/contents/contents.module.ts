import { Module } from '@nestjs/common';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { UploadedImagesModule } from '../uploaded-images/uploaded-images.module';

@Module({
  imports: [UploadedImagesModule],
  controllers: [ContentsController],
  providers: [ContentsService],
})
export class ContentsModule {}
