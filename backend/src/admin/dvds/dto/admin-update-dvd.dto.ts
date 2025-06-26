import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateDVDDto } from './admin-create-dvd.dto';

export class AdminUpdateCDDto extends PartialType(AdminCreateDVDDto) {}
