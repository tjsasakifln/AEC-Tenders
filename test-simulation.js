/**
 * Comprehensive Test Simulation for AEC Tenders Node
 * Tests all functions with various scenarios including edge cases
 */

const { AecTenders } = require('./dist/nodes/AecTenders/AecTenders.node.js');

// Mock IExecuteFunctions for testing
class MockExecuteFunctions {
  constructor(params = {}) {
    this.params = params;
    this.httpRequests = [];
  }

  getNode() {
    return { name: 'Test Node' };
  }

  getNodeParameter(param, index, defaultValue) {
    return this.params[param] !== undefined ? this.params[param] : defaultValue;
  }

  continueOnFail() {
    return false;
  }

  get helpers() {
    return {
      httpRequest: {
        call: async (context, options) => {
          this.httpRequests.push(options);
          
          // Simulate different responses based on endpoint
          if (options.url.includes('/v1/contratacoes/publicacoes')) {
            return this.mockTendersResponse();
          } else if (options.url.includes('/v1/contratacoes/propostas')) {
            return this.mockProposalsResponse();
          } else if (options.url.includes('/v1/orgaos/')) {
            return this.mockTenderDetailResponse();
          }
          
          throw new Error('Unknown endpoint');
        }
      }
    };
  }

  mockTendersResponse() {
    return {
      body: {
        data: [
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
        ]
      }
    };
  }

  mockProposalsResponse() {
    return {
      body: {
        data: [
          {
            numeroControlePNCP: '202501150001234569',
            razaoSocial: 'Prefeitura Municipal de Campinas',
            objetoContratacao: 'Construção de escola municipal',
            dataEncerramento: '2025-02-15T23:59:59Z',
            valorEstimadoTotal: 2500000.00,
            modalidadeContratacao: 'Tomada de Preços'
          }
        ]
      }
    };
  }

  mockTenderDetailResponse() {
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
}

// Test scenarios
const testScenarios = [
  {
    name: 'Test listTendersByDate - Normal case',
    params: {
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: false,
      limit: 50
    },
    operation: 'listTendersByDate',
    expectedResults: 2
  },
  {
    name: 'Test listTendersByDate - Return all',
    params: {
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: true
    },
    operation: 'listTendersByDate',
    expectedResults: 2
  },
  {
    name: 'Test listTendersByDate - Edge case: same start and end date',
    params: {
      startDate: '2025-01-15',
      endDate: '2025-01-15',
      returnAll: false,
      limit: 10
    },
    operation: 'listTendersByDate',
    expectedResults: 2
  },
  {
    name: 'Test searchTendersByKeyword - Single keyword',
    params: {
      keywords: 'construção',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: false,
      limit: 50
    },
    operation: 'searchTendersByKeyword',
    expectedResults: 2
  },
  {
    name: 'Test searchTendersByKeyword - Multiple keywords',
    params: {
      keywords: 'construção, pavimentação',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: false,
      limit: 50
    },
    operation: 'searchTendersByKeyword',
    expectedResults: 2
  },
  {
    name: 'Test searchTendersByKeyword - No matching keywords',
    params: {
      keywords: 'software, tecnologia',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      returnAll: false,
      limit: 50
    },
    operation: 'searchTendersByKeyword',
    expectedResults: 0
  },
  {
    name: 'Test getTenderById - Valid CNPJ',
    params: {
      cnpj: '12345678000195',
      year: '2025',
      sequenceNumber: '1'
    },
    operation: 'getTenderById',
    expectedResults: 1
  },
  {
    name: 'Test getTendersWithOpenProposals - Normal case',
    params: {
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      returnAll: false,
      limit: 50
    },
    operation: 'getTendersWithOpenProposals',
    expectedResults: 1
  }
];

// Edge case scenarios
const edgeCases = [
  {
    name: 'Edge case: Empty keywords',
    params: {
      keywords: '',
      startDate: '2025-01-01',
      endDate: '2025-01-31'
    },
    operation: 'searchTendersByKeyword',
    shouldThrow: true,
    expectedError: 'Keywords are required for search'
  },
  {
    name: 'Edge case: Missing start date',
    params: {
      endDate: '2025-01-31',
      returnAll: false,
      limit: 50
    },
    operation: 'listTendersByDate',
    shouldThrow: true,
    expectedError: 'Start date and end date are required'
  },
  {
    name: 'Edge case: Missing end date',
    params: {
      startDate: '2025-01-01',
      returnAll: false,
      limit: 50
    },
    operation: 'listTendersByDate',
    shouldThrow: true,
    expectedError: 'Start date and end date are required'
  },
  {
    name: 'Edge case: Invalid CNPJ format',
    params: {
      cnpj: '123456789',
      year: '2025',
      sequenceNumber: '1'
    },
    operation: 'getTenderById',
    shouldThrow: true,
    expectedError: 'Invalid CNPJ format'
  },
  {
    name: 'Edge case: CNPJ with special characters',
    params: {
      cnpj: '12.345.678/0001-95',
      year: '2025',
      sequenceNumber: '1'
    },
    operation: 'getTenderById',
    shouldThrow: false,
    expectedResults: 1
  }
];

// Test runner
async function runTests() {
  console.log('🚀 Starting AEC Tenders Node Comprehensive Test Simulation\n');
  
  const node = new AecTenders();
  let passedTests = 0;
  let failedTests = 0;
  
  // Test normal scenarios
  console.log('📋 Testing Normal Scenarios:');
  console.log('=' .repeat(50));
  
  for (const scenario of testScenarios) {
    try {
      console.log(`\n🧪 ${scenario.name}`);
      
      const mockExecFunctions = new MockExecuteFunctions(scenario.params);
      let result;
      
      switch (scenario.operation) {
        case 'listTendersByDate':
          result = await node.listTendersByDate(mockExecFunctions, 0);
          break;
        case 'searchTendersByKeyword':
          result = await node.searchTendersByKeyword(mockExecFunctions, 0);
          break;
        case 'getTenderById':
          result = await node.getTenderById(mockExecFunctions, 0);
          break;
        case 'getTendersWithOpenProposals':
          result = await node.getTendersWithOpenProposals(mockExecFunctions, 0);
          break;
        default:
          throw new Error(`Unknown operation: ${scenario.operation}`);
      }
      
      if (Array.isArray(result) && result.length === scenario.expectedResults) {
        console.log(`✅ PASSED - Got ${result.length} results as expected`);
        if (result.length > 0) {
          console.log(`   📝 Sample result: ${JSON.stringify(result[0], null, 2).substring(0, 200)}...`);
        }
        passedTests++;
      } else {
        console.log(`❌ FAILED - Expected ${scenario.expectedResults} results, got ${Array.isArray(result) ? result.length : 'non-array'}`);
        failedTests++;
      }
      
    } catch (error) {
      console.log(`❌ FAILED - Unexpected error: ${error.message}`);
      failedTests++;
    }
  }
  
  // Test edge cases
  console.log('\n\n🔍 Testing Edge Cases:');
  console.log('=' .repeat(50));
  
  for (const edgeCase of edgeCases) {
    try {
      console.log(`\n🧪 ${edgeCase.name}`);
      
      const mockExecFunctions = new MockExecuteFunctions(edgeCase.params);
      let result;
      let threwError = false;
      let errorMessage = '';
      
      try {
        switch (edgeCase.operation) {
          case 'listTendersByDate':
            result = await node.listTendersByDate(mockExecFunctions, 0);
            break;
          case 'searchTendersByKeyword':
            result = await node.searchTendersByKeyword(mockExecFunctions, 0);
            break;
          case 'getTenderById':
            result = await node.getTenderById(mockExecFunctions, 0);
            break;
          default:
            throw new Error(`Unknown operation: ${edgeCase.operation}`);
        }
      } catch (error) {
        threwError = true;
        errorMessage = error.message;
      }
      
      if (edgeCase.shouldThrow) {
        if (threwError && errorMessage.includes(edgeCase.expectedError)) {
          console.log(`✅ PASSED - Correctly threw expected error: ${errorMessage}`);
          passedTests++;
        } else if (threwError) {
          console.log(`⚠️  PARTIAL - Threw error but message doesn't match. Expected: "${edgeCase.expectedError}", Got: "${errorMessage}"`);
          failedTests++;
        } else {
          console.log(`❌ FAILED - Expected error but function succeeded`);
          failedTests++;
        }
      } else {
        if (!threwError && Array.isArray(result) && result.length === edgeCase.expectedResults) {
          console.log(`✅ PASSED - Function succeeded as expected with ${result.length} results`);
          passedTests++;
        } else if (threwError) {
          console.log(`❌ FAILED - Unexpected error: ${errorMessage}`);
          failedTests++;
        } else {
          console.log(`❌ FAILED - Expected ${edgeCase.expectedResults} results, got ${Array.isArray(result) ? result.length : 'non-array'}`);
          failedTests++;
        }
      }
      
    } catch (error) {
      console.log(`❌ FAILED - Test setup error: ${error.message}`);
      failedTests++;
    }
  }
  
  // Summary
  console.log('\n\n📊 Test Summary:');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n⚠️  Some tests failed. Review the output above for details.');
    return false;
  } else {
    console.log('\n🎉 All tests passed successfully!');
    return true;
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, MockExecuteFunctions };