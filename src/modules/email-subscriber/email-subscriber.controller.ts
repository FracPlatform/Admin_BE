import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { SubscriberDto, UnSubscriberDto } from './dto/email-subscriber.dto';
import { EmailSubcriberService } from './email-subscriber.service';

@Controller('email')
@ApiTags('Email Subscriber')
export class EmailSubscriberController {
  constructor(private readonly subscriberService: EmailSubcriberService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe' })
  async subscribe(@Body() subscriberDto: SubscriberDto) {
    const data = await this.subscriberService.subscribe(subscriberDto);
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('un-subscribe')
  @ApiOperation({ summary: 'UnSubscribe' })
  async unSubscribe(@Body() body: UnSubscriberDto) {
    const data = await this.subscriberService.unSubscribe(body);
    return new ApiSuccessResponse().success(data, '');
  }
}
