import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
export declare class NFCService {
    private prisma;
    private cryptoService;
    constructor(prisma: PrismaService, cryptoService: CryptoService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    getWalletByUID(uid: string): Promise<WalletResponseDto | null>;
    getDecryptedPrivateKey(uid: string): Promise<string | null>;
    private generateInjectiveWallet;
    private validateUID;
    getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        recentRegistrations: number;
    }>;
}
