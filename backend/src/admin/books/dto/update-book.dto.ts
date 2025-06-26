import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateBookDto } from './create-book.dto';

export class AdminUpdateBookDto extends PartialType(AdminCreateBookDto) {}
