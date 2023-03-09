import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class OrderParams {
  @ApiModelProperty({ required: false })
  @IsOptional()
  @Type(() => String)
  orderBy?: string;

  @ApiModelProperty({ required: false })
  @IsOptional()
  @Type(() => String)
  orderDesc?: string;
}
