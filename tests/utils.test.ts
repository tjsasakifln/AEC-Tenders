/**
 * Test suite for AEC Tenders utility functions
 * Tests the core helper functions used throughout the node
 */

import { AecTenders } from '../nodes/AecTenders/AecTenders.node';

describe('AecTenders Utility Functions', () => {
  let nodeInstance: AecTenders;

  beforeEach(() => {
    nodeInstance = new AecTenders();
  });

  describe('validateCNPJ', () => {
    it('should validate correct CNPJ format with 14 digits', () => {
      const validCNPJs = [
        '12345678000190',
        '00000000000191',
        '99999999999999'
      ];

      validCNPJs.forEach(cnpj => {
        expect((nodeInstance as any).validateCNPJ(cnpj)).toBe(true);
      });
    });

    it('should reject invalid CNPJ formats', () => {
      const invalidCNPJs = [
        '123456789',           // Too short
        '123456789001901',     // Too long
        '1234567800019a',      // Contains letter
        '12.345.678/0001-90',  // With formatting
        '',                    // Empty string
        '12 345 678 0001 90',  // With spaces
        'abcdefghijklmn'       // All letters
      ];

      invalidCNPJs.forEach(cnpj => {
        expect((nodeInstance as any).validateCNPJ(cnpj)).toBe(false);
      });
    });
  });

  describe('formatDate', () => {
    it('should format ISO date strings correctly', () => {
      const testCases = [
        { input: '2025-01-15T10:30:00Z', expected: '20250115' },
        { input: '2025-12-31T23:59:59.999Z', expected: '20251231' },
        { input: '2025-07-01T00:00:00.000Z', expected: '20250701' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect((nodeInstance as any).formatDate(input)).toBe(expected);
      });
    });

    it('should handle different date input formats', () => {
      const testCases = [
        { input: '2025-01-15', expected: '20250115' },
        { input: '2025/01/15', expected: '20250115' },
        { input: new Date('2025-01-15').toISOString(), expected: '20250115' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect((nodeInstance as any).formatDate(input)).toBe(expected);
      });
    });
  });

  describe('buildPortalUrl', () => {
    it('should build correct PNCP portal URLs', () => {
      const testCases = [
        { 
          tender: { numeroControlePNCP: '202501150001234567' }, 
          expected: 'https://pncp.gov.br/app/editais/202501150001234567' 
        },
        { 
          tender: { numeroControlePNCP: '202412310009876543' }, 
          expected: 'https://pncp.gov.br/app/editais/202412310009876543' 
        },
        { 
          tender: { numeroControlePNCP: '202507011234567890' }, 
          expected: 'https://pncp.gov.br/app/editais/202507011234567890' 
        }
      ];

      testCases.forEach(({ tender, expected }) => {
        expect((nodeInstance as any).buildPortalUrl(tender)).toBe(expected);
      });
    });

    it('should handle empty or invalid tender objects', () => {
      const invalidTenders = [{}, { numeroControlePNCP: '' }, { numeroControlePNCP: null }];

      invalidTenders.forEach(tender => {
        const result = (nodeInstance as any).buildPortalUrl(tender);
        expect(result).toBe(`https://pncp.gov.br/app/editais/${tender.numeroControlePNCP}`);
      });
    });
  });

  describe('transformTenderData', () => {
    it('should transform PNCP API response to standardized format', () => {
      const mockApiResponse = {
        numeroControlePNCP: '202501150001234567',
        orgaoEntidade: {
          razaoSocial: 'Prefeitura Municipal de Test City',
          cnpj: '12345678000190'
        },
        objetoCompra: 'Contratação de empresa especializada em engenharia civil',
        dataPublicacaoPncp: '2025-01-15T10:00:00Z',
        dataAberturaProposta: '2025-02-15T14:00:00Z',
        valorTotalEstimado: 1500000.50,
        modalidadeNome: 'Concorrência',
        situacaoCompraNome: 'Publicada'
      };

      const result = (nodeInstance as any).transformTenderData(mockApiResponse);

      expect(result).toMatchObject({
        pncpId: '202501150001234567',
        procuringEntityName: 'Prefeitura Municipal de Test City',
        procuringEntityCNPJ: '12345678000190',
        tenderObject: 'Contratação de empresa especializada em engenharia civil',
        publicationDate: '2025-01-15T10:00:00Z',
        proposalOpeningDate: '2025-02-15T14:00:00Z',
        estimatedTotalValue: 1500000.50,
        tenderModality: 'Concorrência',
        tenderSituation: 'Publicada',
        portalUrl: 'https://pncp.gov.br/app/editais/202501150001234567',
        _extractedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        _category: 'engineering',
        _riskScore: expect.any(Number)
      });
    });

    it('should handle missing fields gracefully', () => {
      const incompleteApiResponse = {
        numeroControlePNCP: '202501150001234567',
        // Missing other required fields
      };

      const result = (nodeInstance as any).transformTenderData(incompleteApiResponse);

      expect(result).toMatchObject({
        pncpId: '202501150001234567',
        procuringEntityName: '',
        tenderObject: '',
        publicationDate: '',
        proposalOpeningDate: '',
        estimatedTotalValue: 0,
        portalUrl: 'https://pncp.gov.br/app/editais/202501150001234567',
        _extractedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        _category: 'general',
        _riskScore: expect.any(Number)
      });
    });

    it('should categorize tenders based on object keywords', () => {
      const testCases = [
        { 
          objeto: 'Construção de ponte de concreto armado',
          expectedCategory: 'infrastructure'
        },
        {
          objeto: 'Projeto arquitetônico para edifício residencial',
          expectedCategory: 'architecture'
        },
        {
          objeto: 'Serviços de engenharia elétrica e instalações',
          expectedCategory: 'engineering'
        },
        {
          objeto: 'Reforma e modernização de escola municipal',
          expectedCategory: 'renovation'
        },
        {
          objeto: 'Aquisição de equipamentos de informática',
          expectedCategory: 'general'
        }
      ];

      testCases.forEach(({ objeto, expectedCategory }) => {
        const mockResponse = {
          numeroControlePNCP: '202501150001234567',
          objetoCompra: objeto
        };

        const result = (nodeInstance as any).transformTenderData(mockResponse);
        expect(result._category).toBe(expectedCategory);
      });
    });

    it('should calculate risk scores based on tender characteristics', () => {
      const highValueTender = {
        numeroControlePNCP: '202501150001234567',
        valorTotalEstimado: 50000000, // High value = higher risk
        objetoContratacao: 'Construção de infraestrutura complexa'
      };

      const lowValueTender = {
        numeroControlePNCP: '202501150001234567',
        valorTotalEstimado: 100000, // Low value = lower risk
        objetoContratacao: 'Serviços simples de manutenção'
      };

      const highResult = (nodeInstance as any).transformTenderData(highValueTender);
      const lowResult = (nodeInstance as any).transformTenderData(lowValueTender);

      expect(highResult._riskScore).toBeGreaterThan(lowResult._riskScore);
      expect(highResult._riskScore).toBeGreaterThanOrEqual(0);
      expect(highResult._riskScore).toBeLessThanOrEqual(100);
    });
  });
});