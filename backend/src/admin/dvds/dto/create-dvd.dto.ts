import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto, ProductType } from '../../products/dto/create-product.dto';

export class CreateDVDDto extends CreateProductDto {
  constructor() {
    super();
  }


    @ApiProperty({
        description: 'The type of DVD (e.g., Blu-ray, DVD)',
        example: 'Blu-ray',
    })
    @IsString()
    @IsNotEmpty()
    disctype: string;
    
    @ApiProperty({
        description: 'The director of the DVD',
        example: 'Christopher Nolan',
    })
    @IsString()
    @IsNotEmpty()
    director: string;
    
    @ApiProperty({
        description: 'Runtime of the DVD in minutes',
        example: 120,
    })
    @IsNumber()
    @IsNotEmpty()
    runtime: number;
    
    @ApiProperty({
        description: 'The studio that produced the DVD',
        example: 'Warner Bros.',
    })
    @IsString()
    @IsNotEmpty()
    studio: string;
    
    @ApiProperty({
        description: 'Available subtitles for the DVD',
        example: 'English, Spanish, French',
        default: 'Multiple',
    })
    @IsString()
    subtitles: string;
    
    @ApiProperty({
        description: 'Release date of the DVD',
        example: '2023-10-01',
    })
    @IsDateString()
    releaseddate: Date;
    
    @ApiProperty({
        description: 'Film type or genre of the DVD',
        example: 'Action',
    })
    @IsString()
    filmtype: string;
}
