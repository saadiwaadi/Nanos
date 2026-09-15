import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsString()
  @IsNotEmpty()
  size!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsObject()
  @IsOptional()
  shippingInfo?: Record<string, any>;

  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  @IsOptional()
  guestName?: string;

  @IsString()
  @IsOptional()
  promoCode?: string;
}
