import { NFCService } from './nfc.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
export declare class NFCController {
    private readonly nfcService;
    constructor(nfcService: NFCService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    getWalletByUID(uid: string): Promise<WalletResponseDto>;
    checkDomainAvailability(domain: string): Promise<{
        available: boolean;
        domain: string;
    }>;
    createDomain(body: {
        uid: string;
        domainName: string;
    }): Promise<{
        success: boolean;
        domain?: string;
        error?: string;
    }>;
    unbindNFC(unbindNFCDto: UnbindNFCDto): Promise<{
        success: boolean;
        nfcUnbound: boolean;
        nftBurned: boolean;
        message: string;
    }>;
    getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        walletsWithNFT: number;
        fundedWallets: number;
        recentRegistrations: number;
    }>;
    getWalletBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }>;
}
