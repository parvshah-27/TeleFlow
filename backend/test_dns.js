const dns = require('dns').promises;

async function testDns() {
    const target = '_mongodb._tcp.parvshah27.g7oqgyi.mongodb.net';
    console.log(`Testing DNS resolution for ${target} with custom servers...`);
    try {
        require('dns').setServers(['8.8.8.8', '8.8.4.4']);
        const result = await dns.resolveSrv(target);
        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

testDns();
