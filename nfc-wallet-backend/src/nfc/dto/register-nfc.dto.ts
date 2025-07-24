import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class RegisterNFCDto {
    @ApiProperty({
        description: 'NFC卡片的唯一标识符',
        example: '04:1a:2b:3c:4d:5e:6f',
        minLength: 1,
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    uid: string;
} 