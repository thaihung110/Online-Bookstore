import { PartialType } from '@nestjs/swagger';
import { CreateCDDto } from './create-cd.dto';

export class UpdateCDDto extends PartialType(CreateCDDto) {}