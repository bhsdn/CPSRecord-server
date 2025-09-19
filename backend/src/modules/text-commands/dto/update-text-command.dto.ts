import { PartialType } from '@nestjs/swagger';
import { CreateTextCommandDto } from './create-text-command.dto';

export class UpdateTextCommandDto extends PartialType(CreateTextCommandDto) {}
