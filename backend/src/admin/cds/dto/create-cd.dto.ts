import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto, ProductType } from '../../products/dto/create-product.dto';

export class CreateCDDto extends CreateProductDto {
  constructor() {
    super();
    // Use the enum to ensure type safety
    // this.productType = ProductType.CD;
  }

    @ApiProperty({
        description: 'The type of product',
        example: 'CD',
        default: ProductType.DVD,
    })
    @IsOptional()
  productType: ProductType = ProductType.CD;

  @ApiProperty({
    description: 'The artist of the CD',
    example: 'Adele',
  })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiProperty({
    description: 'Album title',
    example: '25',
  })
  @IsString()
  @IsNotEmpty()
  albumTitle: string;

  @ApiProperty({
    description: 'Track list (comma separated)',
    example: 'Hello, Someone Like You, Rolling in the Deep',
  })
  @IsString()
  @IsNotEmpty()
  trackList: string;

  @ApiProperty({
    description: 'Music category/genre',
    example: 'Pop',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Release date',
    example: '2015-11-20',
  })
  @IsDateString()
  releaseddate: Date;
}
