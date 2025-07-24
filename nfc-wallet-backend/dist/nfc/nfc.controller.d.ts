import { NFCService } from './nfc.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
export declare class NFCController {
    private readonly nfcService;
    constructor(nfcService: NFCService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    getWalletByUID(uid: string): Promise<WalletResponseDto>;
    getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        recentRegistrations: number;
    }>;
}
