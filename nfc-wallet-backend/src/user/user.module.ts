import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ContractModule } from '../contract/contract.module';

@Module({
    imports: [ContractModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { } 