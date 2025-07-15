/**
 * Test the corrected PNCP endpoint
 */

const https = require('https');

// Test the corrected endpoint
const scenarios = [
  {
    name: 'Corrected publicacao endpoint (singular)',
    url: 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao',
    params: {
      dataInicial: '20250101',
      dataFinal: '20250131',
      codigoModalidadeContratacao: 6, // Using 6 like in the working example
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Test propostas endpoint (plural)',
    url: 'https://pncp.gov.br/api/consulta/v1/contratacoes/propostas',
    params: {
      dataFinal: '20250731',
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Test proposta endpoint (singular)',
    url: 'https://pncp.gov.br/api/consulta/v1/contratacoes/proposta',
    params: {
      dataFinal: '20250731',
      pagina: 1,
      tamanhoPagina: 10
    }
  }
];

function testEndpoint(scenario) {
  return new Promise((resolve) => {
    const queryString = new URLSearchParams(scenario.params).toString();
    const fullUrl = `${scenario.url}?${queryString}`;
    
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`URL: ${fullUrl}`);
    
    const req = https.get(fullUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'n8n-aec-tenders/0.1.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`✅ SUCCESS: Found ${parsed.data?.length || 0} results`);
            if (parsed.data && parsed.data.length > 0) {
              console.log(`Sample fields:`, Object.keys(parsed.data[0]));
            }
          } catch (e) {
            console.log(`✅ SUCCESS but invalid JSON: ${data.substring(0, 100)}...`);
          }
        } else if (res.statusCode === 403) {
          console.log(`⚠️  FORBIDDEN - Endpoint exists but access denied`);
        } else if (res.statusCode === 400) {
          console.log(`⚠️  BAD REQUEST: ${data.substring(0, 200)}`);
        } else {
          console.log(`❌ FAILED (${res.statusCode}): ${data.substring(0, 200)}`);
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

async function testCorrectedEndpoints() {
  console.log('🔍 Testing Corrected PNCP API Endpoints\n');
  
  for (const scenario of scenarios) {
    await testEndpoint(scenario);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎯 Test Complete');
}

testCorrectedEndpoints().catch(console.error);