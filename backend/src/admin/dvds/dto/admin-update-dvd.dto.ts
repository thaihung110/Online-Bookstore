import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateDVDDto } from './admin-create-dvd.dto';

export class AdminUpdateDVDDto extends PartialType(AdminCreateDVDDto) {}
