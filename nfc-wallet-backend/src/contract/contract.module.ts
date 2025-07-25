import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { InjectiveService } from './injective.service';

@Module({
    providers: [ContractService, InjectiveService],
    exports: [ContractService, InjectiveService],
})
export class ContractModule { } 