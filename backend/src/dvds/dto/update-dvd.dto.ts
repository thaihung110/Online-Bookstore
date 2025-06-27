import { PartialType } from '@nestjs/swagger';
import { CreateDVDDto } from './create-dvd.dto';

export class UpdateDVDDto extends PartialType(CreateDVDDto) {}