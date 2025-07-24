import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
    @ApiProperty({
        description: 'Injective钱包地址',
        example: 'inj1...',
    })
    address: string;

    @ApiProperty({
        description: '以太坊格式地址（兼容性）',
        example: '0x742d35Cc6bb7C...',
        required: false,
    })
    ethAddress?: string;

    @ApiProperty({
        description: 'NFC UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    })
    uid: string;

    @ApiProperty({
        description: '用户自定义.inj域名',
        example: 'alice.inj',
        required: false,
    })
    domain?: string;

    @ApiProperty({
        description: '是否为新创建的钱包',
        example: true,
    })
    isNewWallet: boolean;

    @ApiProperty({
        description: '创建时间',
        example: '2024-01-01T00:00:00.000Z',
    })
    createdAt: Date;
} 