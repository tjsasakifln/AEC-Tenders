/**
 * Test script to verify correct PNCP API endpoints
 */

const https = require('https');

// Test different endpoint combinations
const testEndpoints = [
  'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacoes',
  'https://pncp.gov.br/api/pncp-consulta/v1/contratacoes/publicacoes',
  'https://pncp.gov.br/api/consulta/contratacoes/publicacoes',
  'https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes',
  'https://pncp.gov.br/api/v1/contratacoes/publicacoes',
  'https://pncp.gov.br/pncp-api/v1/contratacoes/publicacoes'
];

const testParams = {
  dataInicial: '20250101',
  dataFinal: '20250131',
  codigoModalidadeContratacao: 1,
  pagina: 1,
  tamanhoPagina: 10
};

function testEndpoint(url) {
  return new Promise((resolve) => {
    const queryString = new URLSearchParams(testParams).toString();
    const fullUrl = `${url}?${queryString}`;
    
    console.log(`\nTesting: ${fullUrl}`);
    
    const req = https.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'n8n-aec-tenders/0.1.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`✅ SUCCESS: Found ${parsed.data?.length || 0} results`);
            console.log(`Sample response:`, JSON.stringify(parsed).substring(0, 200) + '...');
          } catch (e) {
            console.log(`✅ SUCCESS but invalid JSON: ${data.substring(0, 100)}...`);
          }
        } else {
          console.log(`❌ FAILED: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ERROR: ${error.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log(`❌ TIMEOUT`);
      req.destroy();
      resolve();
    });
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing PNCP API Endpoints\n');
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between requests
  }
  
  console.log('\n🎯 Test Complete');
}

testAllEndpoints().catch(console.error);