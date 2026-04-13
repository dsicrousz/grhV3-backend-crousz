import { Global, Module } from '@nestjs/common';
import { LogAggregatorService } from './log-aggregator.service';
import { LogAggregatorInterceptor } from './interceptors/log-aggregator.interceptor';

@Global()
@Module({
  providers: [LogAggregatorService, LogAggregatorInterceptor],
  exports: [LogAggregatorService, LogAggregatorInterceptor],
})
export class LogAggregatorModule {}
