import { Module } from '@nestjs/common';
import { TextCommandsController } from './text-commands.controller';
import { TextCommandsService } from './text-commands.service';

@Module({
  controllers: [TextCommandsController],
  providers: [TextCommandsService],
})
export class TextCommandsModule {}
