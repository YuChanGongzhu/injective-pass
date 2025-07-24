import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBadRequestResponse,
    ApiConflictResponse,
} from '@nestjs/swagger';
import { NFCService } from './nfc.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { NFCStatusResponseDto } from './dto/nfc-status-response.dto';
import { CardOwnershipResponseDto } from './dto/card-ownership-response.dto';

@ApiTags('NFC钱包管理')
@Controller('api/nfc')
export class NFCController {
    constructor(private readonly nfcService: NFCService) { }

    @Post('register')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '注册NFC卡片',
        description: '通过NFC UID注册并生成以太坊钱包，如果已存在则返回现有钱包信息',
    })
    @ApiResponse({
        status: 200,
        description: '成功注册或返回已有钱包',
        type: WalletResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'NFC UID格式无效或其他输入错误',
    })
    @ApiConflictResponse({
        description: '该NFC UID已被注册',
    })
    async registerNFC(@Body() registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto> {
        return this.nfcService.registerNFC(registerNFCDto);
    }

    @Get('wallet/:uid')
    @ApiOperation({
        summary: '根据UID获取钱包信息',
        description: '通过NFC UID查询对应的以太坊钱包信息',
    })
    @ApiParam({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    })
    @ApiResponse({
        status: 200,
        description: '成功获取钱包信息',
        type: WalletResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: '未找到对应的钱包',
    })
    async getWalletByUID(@Param('uid') uid: string): Promise<WalletResponseDto> {
        const wallet = await this.nfcService.getWalletByUID(uid);

        if (!wallet) {
            throw new NotFoundException('未找到对应的钱包');
        }

        return wallet;
    }

    @Get('stats')
    @ApiOperation({
        summary: '获取钱包统计信息',
        description: '获取系统中钱包的统计数据',
    })
    @ApiResponse({
        status: 200,
        description: '成功获取统计信息',
        schema: {
            type: 'object',
            properties: {
                totalWallets: {
                    type: 'number',
                    description: '总钱包数量',
                    example: 100,
                },
                walletsWithUsername: {
                    type: 'number',
                    description: '设置了用户名的钱包数量',
                    example: 75,
                },
                recentRegistrations: {
                    type: 'number',
                    description: '最近24小时注册的钱包数量',
                    example: 5,
                },
            },
        },
    })
    async getWalletStats() {
        return this.nfcService.getWalletStats();
    }
} 