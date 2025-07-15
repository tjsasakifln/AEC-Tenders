/**
 * Test suite for PNCP API integration methods
 * Tests the data processing and API interaction logic
 */

import { AecTenders } from '../nodes/AecTenders/AecTenders.node';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock the n8n workflow interfaces
const mockExecuteFunctions = {
  getNodeParameter: jest.fn(),
  getNode: jest.fn(() => ({ name: 'AEC Tenders Test' })),
  helpers: {
    httpRequest: {
      call: jest.fn()
    }
  },
  continueOnFail: jest.fn(() => false)
} as unknown as IExecuteFunctions;

describe('PNCP API Integration', () => {
  let nodeInstance: AecTenders;

  beforeEach(() => {
    nodeInstance = new AecTenders();
    jest.clearAllMocks();
  });

  describe('makeAPIRequest', () => {
    it('should make correct API requests to PNCP', async () => {
      const mockResponse = {
        body: {
          data: [
            {
              numeroControlePNCP: '202501150001234567',
              razaoSocial: 'Test Entity',
              objetoContratacao: 'Test Object'
            }
          ]
        }
      };

      (mockExecuteFunctions.helpers.httpRequest.call as jest.Mock).mockResolvedValue(mockResponse);

      const result = await (nodeInstance as any).makeAPIRequest(
        mockExecuteFunctions,
        '/v1/contratacoes/publicacoes',
        { dataInicial: '2025-01-01', dataFinal: '2025-01-31' }
      );

      expect(mockExecuteFunctions.helpers.httpRequest.call).toHaveBeenCalledWith(
        mockExecuteFunctions,
        {
          method: 'GET',
          url: 'https://pncp.gov.br/api/pncp-consulta/v1/contratacoes/publicacoes',
          qs: { dataInicial: '2025-01-01', dataFinal: '2025-01-31' },
          headers: {
            Accept: 'application/json',
            'User-Agent': 'n8n-aec-tenders/0.1.0',
            'X-Request-ID': expect.any(String),
          },
          returnFullResponse: true,
          json: true,
          timeout: 30000,
        }
      );

      expect(result).toEqual(mockResponse.body);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      (mockExecuteFunctions.helpers.httpRequest.call as jest.Mock).mockRejectedValue(mockError);

      await expect(
        (nodeInstance as any).makeAPIRequest(
          mockExecuteFunctions,
          '/v1/contratacoes/publicacoes',
          {}
        )
      ).rejects.toThrow('Erro inesperado na API PNCP: Network error');
    });
  });

  describe('listTendersByDate', () => {
    beforeEach(() => {
      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValueOnce('2025-01-01T00:00:00Z') // startDate
        .mockReturnValueOnce('2025-01-31T23:59:59Z') // endDate
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce(10); // limit
    });

    it('should process date range requests correctly', async () => {
      const mockApiResponse = {
        data: [
          {
            numeroControlePNCP: '202501150001234567',
            razaoSocial: 'Municipality Test',
            objetoContratacao: 'Civil engineering services',
            dataPublicacaoPncp: '2025-01-15T10:00:00Z',
            dataAberturaProposta: '2025-02-15T14:00:00Z',
            valorTotalEstimado: 1000000
          }
        ]
      };

      (mockExecuteFunctions.helpers.httpRequest.call as jest.Mock).mockResolvedValue({
        body: mockApiResponse
      });

      const result = await (nodeInstance as any).listTendersByDate(mockExecuteFunctions, 0);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        pncpId: '202501150001234567',
        procuringEntityName: 'Municipality Test',
        tenderObject: 'Civil engineering services',
        estimatedTotalValue: 1000000
      });
    });

    it('should handle pagination correctly', async () => {
      // Mock multiple pages of results
      const page1Response = {
        data: Array(20).fill(null).map((_, i) => ({
          numeroControlePNCP: `20250115000123456${i}`,
          razaoSocial: `Entity ${i}`,
          objetoContratacao: `Object ${i}`
        }))
      };

      const page2Response = {
        data: Array(5).fill(null).map((_, i) => ({
          numeroControlePNCP: `20250115000123457${i}`,
          razaoSocial: `Entity ${i + 20}`,
          objetoContratacao: `Object ${i + 20}`
        }))
      };

      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValueOnce('2025-01-01T00:00:00Z')
        .mockReturnValueOnce('2025-01-31T23:59:59Z')
        .mockReturnValueOnce(true) // returnAll = true
        .mockReturnValueOnce(50);

      (mockExecuteFunctions.helpers.httpRequest.call as jest.Mock)
        .mockResolvedValueOnce({ body: page1Response })
        .mockResolvedValueOnce({ body: page2Response })
        .mockResolvedValueOnce({ body: { data: [] } }); // Empty page to stop pagination

      const result = await (nodeInstance as any).listTendersByDate(mockExecuteFunctions, 0);

      expect(result).toHaveLength(25); // 20 + 5 results
      expect(mockExecuteFunctions.helpers.httpRequest.call).toHaveBeenCalledTimes(3);
    });
  });

  describe('searchTendersByKeyword', () => {
    it('should filter tenders by keywords correctly', async () => {
      const mockTenders = [
        {
          pncpId: '1',
          tenderObject: 'Construção de ponte de concreto',
          procuringEntityName: 'Municipality A'
        },
        {
          pncpId: '2', 
          tenderObject: 'Aquisição de equipamentos médicos',
          procuringEntityName: 'Municipality B'
        },
        {
          pncpId: '3',
          tenderObject: 'Reforma de infraestrutura viária',
          procuringEntityName: 'Municipality C'
        }
      ];

      // Mock the listTendersByDate method to return our test data
      jest.spyOn(nodeInstance as any, 'listTendersByDate').mockResolvedValue(mockTenders);

      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValueOnce('construção, infraestrutura') // keywords
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce(10); // limit

      const result = await (nodeInstance as any).searchTendersByKeyword(mockExecuteFunctions, 0);

      expect(result).toHaveLength(2); // Should match 'construção' and 'infraestrutura'
      expect(result[0].pncpId).toBe('1');
      expect(result[1].pncpId).toBe('3');
    });

    it('should handle case-insensitive keyword matching', async () => {
      const mockTenders = [
        {
          pncpId: '1',
          tenderObject: 'CONSTRUÇÃO DE PONTE',
          procuringEntityName: 'Municipality A'
        }
      ];

      jest.spyOn(nodeInstance as any, 'listTendersByDate').mockResolvedValue(mockTenders);

      (mockExecuteFunctions.getNodeParameter as jest.Mock).mockClear();
      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValueOnce('construção') // lowercase keyword
        .mockReturnValueOnce('2025-01-01')
        .mockReturnValueOnce('2025-12-31')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(10);

      const result = await (nodeInstance as any).searchTendersByKeyword(mockExecuteFunctions, 0);

      expect(result).toHaveLength(1);
      expect(result[0].pncpId).toBe('1');
    });
  });

  describe('getTenderDetailsById', () => {
    it('should validate CNPJ before making API request', async () => {
      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValueOnce('invalid-cnpj') // procuringEntityCNPJ
        .mockReturnValueOnce(2025) // year
        .mockReturnValueOnce(1); // sequenceNumber

      await expect(
        (nodeInstance as any).getTenderById(mockExecuteFunctions, 0)
      ).rejects.toThrow('Invalid CNPJ format');
    });

    it('should make correct API request for tender details', async () => {
      const mockResponse = {
        numeroControlePNCP: '202501150001234567',
        razaoSocial: 'Test Municipality',
        objetoContratacao: 'Detailed tender object'
      };

      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValueOnce('12345678000190') // valid CNPJ
        .mockReturnValueOnce(2025)
        .mockReturnValueOnce(1);

      (mockExecuteFunctions.helpers.httpRequest.call as jest.Mock).mockResolvedValue({
        body: mockResponse
      });

      const result = await (nodeInstance as any).getTenderById(mockExecuteFunctions, 0);

      expect(mockExecuteFunctions.helpers.httpRequest.call).toHaveBeenCalledWith(
        mockExecuteFunctions,
        expect.objectContaining({
          url: 'https://pncp.gov.br/api/consulta/v1/orgaos/12345678000190/compras/2025/1'
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].pncpId).toBe('202501150001234567');
    });
  });
});