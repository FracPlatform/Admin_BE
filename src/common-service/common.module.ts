import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { SocketModule } from 'src/providers/socket/socket.module';

@Module({
  imports: [SocketModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
