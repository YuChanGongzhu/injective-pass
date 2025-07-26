import { NFCService } from './nfc.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { UnbindResponseDto } from './dto/unbind-response.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { RegisterDomainDto, DomainNFTResponseDto } from './dto/domain-nft.dto';
import { DrawCatNFTDto, CatNFTResponseDto, CatNFTListDto } from './dto/cat-nft.dto';
export declare class NFCController {
    private readonly nfcService;
    constructor(nfcService: NFCService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    getWalletByUID(uid: string): Promise<WalletResponseDto>;
    checkDomainAvailability(domain: string): Promise<import("./dto/domain-nft.dto").DomainAvailabilityDto>;
    registerDomainNFT(registerDomainDto: RegisterDomainDto): Promise<DomainNFTResponseDto>;
    unbindNFC(unbindNFCDto: UnbindNFCDto): Promise<UnbindResponseDto>;
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
    drawCatNFT(drawCatNFTDto: DrawCatNFTDto): Promise<CatNFTResponseDto>;
    getUserCatNFTs(uid: string): Promise<CatNFTListDto>;
}
export declare class ContractController {
    private readonly nfcService;
    constructor(nfcService: NFCService);
    getContractStatus(): Promise<{
        nfcRegistry: boolean;
        domainNFT: boolean;
        catNFT: boolean;
        networkInfo: any;
    }>;
}
