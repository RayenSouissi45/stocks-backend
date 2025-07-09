import { Module } from '@nestjs/common';
import { SecForm4Service } from './sec-form4.service';
import { SecForm4Controller } from './sec-form4.controller';

@Module({
  controllers: [SecForm4Controller],
  providers: [SecForm4Service],
  exports: [SecForm4Service],
})
export class SecModule {}
