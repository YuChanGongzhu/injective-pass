import { Module } from '@nestjs/common';
import { NFCController } from './nfc.controller';
import { NFCService } from './nfc.service';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
    imports: [CryptoModule],
    controllers: [NFCController],
    providers: [NFCService],
    exports: [NFCService],
})
export class NFCModule { } 