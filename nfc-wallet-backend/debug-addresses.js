const { PrismaClient } = require('@prisma/client');

async function checkAddresses() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://nfc_user:secure_password_123@localhost:5432/nfc_wallet?schema=public"
            }
        }
    });

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                address: true,
                ethAddress: true,
            }
        });

        console.log('数据库中的用户地址:');
        users.forEach(user => {
            console.log(`用户 ${user.id}:`);
            console.log(`  Injective地址: "${user.address}" (长度: ${user.address?.length})`);
            console.log(`  以太坊地址: "${user.ethAddress}" (长度: ${user.ethAddress?.length})`);
            console.log('---');
        });
    } catch (error) {
        console.error('查询数据库失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAddresses();
