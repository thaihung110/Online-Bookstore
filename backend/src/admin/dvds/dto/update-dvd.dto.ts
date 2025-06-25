import { PartialType } from '@nestjs/mapped-types';
import { CreateDVDDto } from './create-dvd.dto';

export class UpdateCDDto extends PartialType(CreateDVDDto) {}
