import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class ErrorException {
  @ApiModelPropertyOptional() code: number;
  @ApiModelPropertyOptional() error: string;
  @ApiModelPropertyOptional() message: string;
}

export class ApiException {
  @ApiModelPropertyOptional() status?: boolean;
  @ApiModelPropertyOptional() error?: ErrorException;
  @ApiModelPropertyOptional() data?: any;
}
