import { PartialType } from '@nestjs/mapped-types';
import { CreateCDDto } from './create-cd.dto';

export class UpdateCDDto extends PartialType(CreateCDDto) {}
