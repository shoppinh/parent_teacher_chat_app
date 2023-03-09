import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class GetConversationsDto {
  @ApiModelProperty({ required: false })
  text?: string;

  // @ApiModelProperty({ required: false })
  // orderId?: number;
  //
  // @ApiModelProperty({ required: false })
  // userName?: string;
}
