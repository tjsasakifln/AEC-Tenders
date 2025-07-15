/**
 * Simple test to identify specific issues in AEC Tenders Node
 */

const { AecTenders } = require('./dist/nodes/AecTenders/AecTenders.node.js');

// Simple mock that returns limited data to prevent infinite loops
class SimpleMockExecuteFunctions {
  constructor(params = {}) {
    this.params = params;
    this.callCount = 0;
  }

  getNode() {
    return { name: 'Test Node' };
  }

  getNodeParameter(param, index, defaultValue) {
    const value = this.params[param] !== undefined ? this.params[param] : defaultValue;
    console.log(`Getting parameter: ${param} = ${value}`);
    return value;
  }

  continueOnFail() {
    return false;
  }

  get helpers() {
    return {
      httpRequest: {
        call: async (context, options) => {
          this.callCount++;
          console.log(`HTTP Request #${this.callCount}: ${options.method} ${options.url}`);
          console.log(`Query params:`, options.qs);
          
          // Prevent infinite pagination by limiting calls
          if (this.callCount > 3) {
            return { body: { data: [] } };
          }
          
          // Return different data based on endpoint
          if (options.url.includes('/v1/contratacoes/publicacao')) {
            return {
              body: {
                data: this.callCount === 1 ? [
                  {
                    numeroControlePNCP: '202501150001234567',
                    razaoSocial: 'Município de São Paulo',
                    objetoContratacao: 'Construção de ponte sobre o rio Tietê',
                    dataPublicacaoTURE: '2025-01-15T10:00:00Z',
                    valorEstimadoTotal: 5000000.00,
                    modalidadeContratacao: 'Concorrência',
                    situacaoContratacao: 'Publicada'
                  },
                  {
                    numeroControlePNCP: '202501150001234568',
                    razaoSocial: 'Estado de São Paulo',
                    objetoContratacao: 'Pavimentação de rodovia estadual',
                    dataPublicacaoTURE: '2025-01-16T14:30:00Z',
                    valorEstimadoTotal: 8000000.00,
                    modalidadeContratacao: 'Concorrência',
                    situacaoContratacao: 'Publicada'
                  }
                ] : []
              }
            };
          } else if (options.url.includes('/v1/contratacoes/proposta')) {
            return {
              body: {
                data: this.callCount === 1 ? [
                  {
                    numeroControlePNCP: '202501150001234569',
                    razaoSocial: 'Prefeitura Municipal de Campinas',
                    objetoContratacao: 'Construção de escola municipal',
                    dataEncerramento: '2025-02-15T23:59:59Z',
                    valorEstimadoTotal: 2500000.00,
                    modalidadeContratacao: 'Tomada de Preços'
                  }
                ] : []
              }
            };
          } else if (options.url.includes('/v1/orgaos/')) {
            return {
              body: {
                numeroControlePNCP: '202501150001234567',
                razaoSocial: 'Município de São Paulo',
                objetoContratacao: 'Construção de ponte sobre o rio Tietê - Detalhado',
                valorEstimadoTotal: 5000000.00,
                modalidadeContratacao: 'Concorrência',
                dataPublicacaoTURE: '2025-01-15T10:00:00Z',
                dataEncerramento: '2025-02-15T18:00:00Z',
                especificacoes: 'Ponte em concreto armado, extensão 200m'
              }
            };
          }
          
          throw new Error(`Unknown endpoint: ${options.url}`);
        }
      }
    };
  }
}

async function testFunction(testName, testFunction) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('-'.repeat(50));
  
  try {
    const result = await testFunction();
    console.log(`✅ SUCCESS: ${JSON.stringify(result).substring(0, 200)}...`);
    console.log(`📊 Result length: ${Array.isArray(result) ? result.length : 'Not an array'}`);
    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    console.log(`🔍 Stack: ${error.stack?.substring(0, 300)}...`);
    return false;
  }
}

async function runSimpleTests() {
  console.log('🎯 Running Simple AEC Tenders Tests\n');
  
  const node = new AecTenders();
  
  // Test 1: listTendersByDate
  await testFunction('listTendersByDate with limit', async () => {
    const mock = new SimpleMockExecuteFunctions({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: false,
      limit: 5
    });
    return await node.listTendersByDate(mock, 0);
  });
  
  // Test 2: searchTendersByKeyword
  await testFunction('searchTendersByKeyword', async () => {
    const mock = new SimpleMockExecuteFunctions({
      keywords: 'construção',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: false,
      limit: 5
    });
    return await node.searchTendersByKeyword(mock, 0);
  });
  
  // Test 3: getTenderById
  await testFunction('getTenderById', async () => {
    const mock = new SimpleMockExecuteFunctions({
      procuringEntityCNPJ: '12345678000195',
      year: '2025',
      sequenceNumber: '1'
    });
    return await node.getTenderById(mock, 0);
  });
  
  // Test 4: getTendersWithOpenProposals
  await testFunction('getTendersWithOpenProposals', async () => {
    const mock = new SimpleMockExecuteFunctions({
      stateUf: 'SP',
      returnAll: false,
      limit: 5
    });
    return await node.getTendersWithOpenProposals(mock, 0);
  });
  
  // Test 5: Edge case - empty keywords
  await testFunction('searchTendersByKeyword with empty keywords', async () => {
    const mock = new SimpleMockExecuteFunctions({
      keywords: '',
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    });
    return await node.searchTendersByKeyword(mock, 0);
  });
  
  // Test 6: Edge case - invalid CNPJ
  await testFunction('getTenderById with invalid CNPJ', async () => {
    const mock = new SimpleMockExecuteFunctions({
      procuringEntityCNPJ: '12345',
      year: '2025',
      sequenceNumber: '1'
    });
    return await node.getTenderById(mock, 0);
  });
}

runSimpleTests().catch(console.error);