import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateCDDto } from './admin-create-cd.dto';

export class AdminUpdateCDDto extends PartialType(AdminCreateCDDto) {}
