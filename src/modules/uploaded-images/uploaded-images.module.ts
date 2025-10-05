import { Module } from '@nestjs/common';
import { UploadedImagesController } from './uploaded-images.controller';
import { UploadedImagesService } from './uploaded-images.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UploadedImagesController],
  providers: [UploadedImagesService],
  exports: [UploadedImagesService],
})
export class UploadedImagesModule {}
