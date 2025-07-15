/**
 * Test different parameter combinations for PNCP API
 */

const https = require('https');

const baseUrl = 'https://pncp.gov.br/api/consulta';

// Test different parameter combinations
const testScenarios = [
  {
    name: 'Original parameters with modalidade 1',
    endpoint: '/v1/contratacoes/publicacoes',
    params: {
      dataInicial: '20250101',
      dataFinal: '20250131',
      codigoModalidadeContratacao: 1,
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Without modalidade parameter',
    endpoint: '/v1/contratacoes/publicacoes',
    params: {
      dataInicial: '20250101',
      dataFinal: '20250131',
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Without version in path',
    endpoint: '/contratacoes/publicacoes',
    params: {
      dataInicial: '20250101',
      dataFinal: '20250131',
      codigoModalidadeContratacao: 1,
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Different date format (with hyphens)',
    endpoint: '/v1/contratacoes/publicacoes',
    params: {
      dataInicial: '2025-01-01',
      dataFinal: '2025-01-31',
      codigoModalidadeContratacao: 1,
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Test proposals endpoint',
    endpoint: '/v1/contratacoes/propostas',
    params: {
      dataFinal: '20250731',
      pagina: 1,
      tamanhoPagina: 10
    }
  },
  {
    name: 'Test minimal parameters',
    endpoint: '/v1/contratacoes/publicacoes',
    params: {
      dataInicial: '20250101',
      dataFinal: '20250131'
    }
  }
];

function testScenario(scenario) {
  return new Promise((resolve) => {
    const queryString = new URLSearchParams(scenario.params).toString();
    const fullUrl = `${baseUrl}${scenario.endpoint}?${queryString}`;
    
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
          console.log(`⚠️  BAD REQUEST - Check parameters: ${data.substring(0, 200)}`);
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

async function testAllScenarios() {
  console.log('🔍 Testing PNCP API Parameter Combinations\n');
  
  for (const scenario of testScenarios) {
    await testScenario(scenario);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between requests
  }
  
  console.log('\n🎯 Test Complete');
}

testAllScenarios().catch(console.error);