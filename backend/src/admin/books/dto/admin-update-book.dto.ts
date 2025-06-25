import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateBookDto } from './admin-create-book.dto';

export class AdminUpdateBookDto extends PartialType(AdminCreateBookDto) {}
