import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import type { NodeConnectionType } from 'n8n-workflow';

import {
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	IDataObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * PNCP API Error Types - Based on official API documentation
 * Maps HTTP status codes to specific PNCP error scenarios
 */
interface PNCPApiError {
	status: number;
	code: string;
	message: string;
	details?: string;
	retryable: boolean;
}

/**
 * Known PNCP API error patterns and their handling strategies
 */
const PNCP_ERROR_PATTERNS: Record<number, PNCPApiError> = {
	400: {
		status: 400,
		code: 'INVALID_REQUEST',
		message: 'Parâmetros de consulta inválidos ou malformados',
		details: 'Verifique os parâmetros de data, CNPJ e outros campos obrigatórios',
		retryable: false
	},
	401: {
		status: 401,
		code: 'UNAUTHORIZED',
		message: 'Acesso não autorizado à API PNCP',
		details: 'Credenciais de acesso não fornecidas ou inválidas',
		retryable: false
	},
	403: {
		status: 403,
		code: 'FORBIDDEN',
		message: 'Acesso negado aos dados solicitados',
		details: 'O usuário não possui permissão para acessar estes dados',
		retryable: false
	},
	404: {
		status: 404,
		code: 'NOT_FOUND',
		message: 'Licitação ou endpoint não encontrado',
		details: 'Verifique se o CNPJ, ano e número sequencial estão corretos',
		retryable: false
	},
	422: {
		status: 422,
		code: 'UNPROCESSABLE_ENTITY',
		message: 'Dados de entrada não podem ser processados',
		details: 'Formato de data inválido ou parâmetros inconsistentes',
		retryable: false
	},
	429: {
		status: 429,
		code: 'RATE_LIMIT_EXCEEDED',
		message: 'Limite de requisições excedido',
		details: 'Aguarde antes de fazer novas requisições à API PNCP',
		retryable: true
	},
	500: {
		status: 500,
		code: 'INTERNAL_SERVER_ERROR',
		message: 'Erro interno do servidor PNCP',
		details: 'Problema temporário nos servidores do governo',
		retryable: true
	},
	502: {
		status: 502,
		code: 'BAD_GATEWAY',
		message: 'Gateway inválido no acesso à API PNCP',
		details: 'Problema de conectividade com os servidores governamentais',
		retryable: true
	},
	503: {
		status: 503,
		code: 'SERVICE_UNAVAILABLE',
		message: 'Serviço PNCP temporariamente indisponível',
		details: 'API em manutenção ou sobrecarga temporária',
		retryable: true
	},
	504: {
		status: 504,
		code: 'GATEWAY_TIMEOUT',
		message: 'Timeout na conexão com a API PNCP',
		details: 'Requisição demorou muito para ser processada',
		retryable: true
	}
};

export class AecTenders implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AEC Tenders',
		name: 'aecTenders',
		icon: 'file:icons/AecTenders.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Fetches public construction tenders from Brazil\'s PNCP',
		defaults: {
			name: 'AEC Tenders',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Tender',
						value: 'tender',
					},
				],
				default: 'tender',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['tender'],
					},
				},
				options: [
					{
						name: 'List by Publication Date',
						value: 'listByPublicationDate',
						description: 'Get tenders published within a date range',
						action: 'List tenders by publication date',
					},
					{
						name: 'List with Open Proposals',
						value: 'listWithOpenProposals',
						description: 'Get tenders currently accepting proposals',
						action: 'List tenders with open proposals',
					},
					{
						name: 'Get Details by ID',
						value: 'getDetailsById',
						description: 'Get detailed information about a specific tender',
						action: 'Get tender details by ID',
					},
					{
						name: 'Search by Keyword',
						value: 'searchByKeyword',
						description: 'Search tenders by keywords in the contract object',
						action: 'Search tenders by keyword',
					},
				],
				default: 'listByPublicationDate',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['listByPublicationDate', 'searchByKeyword'],
					},
				},
				default: '',
				placeholder: '2024-01-01',
				description: 'Start date for the search (YYYY-MM-DD format)',
				required: true,
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['listByPublicationDate', 'searchByKeyword'],
					},
				},
				default: '',
				placeholder: '2024-12-31',
				description: 'End date for the search (YYYY-MM-DD format)',
				required: true,
			},
			{
				displayName: 'State (UF)',
				name: 'stateUf',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['listWithOpenProposals'],
					},
				},
				default: '',
				placeholder: 'SP',
				description: 'Optional: Brazilian state code (e.g., SP, RJ, MG)',
			},
			{
				displayName: 'Procuring Entity CNPJ',
				name: 'procuringEntityCNPJ',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['getDetailsById'],
					},
				},
				default: '',
				placeholder: '12345678000190',
				description: 'CNPJ of the procuring entity (14 digits)',
				required: true,
			},
			{
				displayName: 'Year',
				name: 'year',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['getDetailsById'],
					},
				},
				default: new Date().getFullYear(),
				description: 'Year of the tender',
				required: true,
			},
			{
				displayName: 'Sequence Number',
				name: 'sequenceNumber',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['getDetailsById'],
					},
				},
				default: 1,
				description: 'Sequential number of the tender',
				required: true,
			},
			{
				displayName: 'Keywords',
				name: 'keywords',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['searchByKeyword'],
					},
				},
				default: '',
				placeholder: 'engenharia, construção, reforma',
				description: 'Keywords to search in tender objects (comma-separated)',
				required: true,
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['listByPublicationDate', 'listWithOpenProposals', 'searchByKeyword'],
					},
				},
				default: false,
				description: 'Whether to return all results or limit the number of results',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['tender'],
						operation: ['listByPublicationDate', 'listWithOpenProposals', 'searchByKeyword'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				default: 50,
				description: 'Max number of results to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const nodeInstance = new AecTenders();

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'tender') {
					let responseData: IDataObject[] = [];

					switch (operation) {
						case 'listByPublicationDate':
							responseData = await nodeInstance.listTendersByDate(this, i);
							break;
						case 'listWithOpenProposals':
							responseData = await nodeInstance.getTendersWithOpenProposals(this, i);
							break;
						case 'getDetailsById':
							responseData = await nodeInstance.getTenderDetailsById(this, i);
							break;
						case 'searchByKeyword':
							responseData = await nodeInstance.searchTendersByKeyword(this, i);
							break;
						default:
							throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not supported`);
					}

					returnData.push(...responseData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
				} else {
					throw error;
				}
			}
		}

		return [returnData.map((data) => ({ json: data }))];
	}

	private validateCNPJ(cnpj: string): boolean {
		return /^\d{14}$/.test(cnpj);
	}

	private formatDate(date: string): string {
		const d = new Date(date);
		return d.toISOString().split('T')[0];
	}

	private buildPortalUrl(pncpId: string): string {
		return `https://pncp.gov.br/app/editais/${pncpId}`;
	}

	/**
	 * Transforms raw PNCP API response data into standardized tender object
	 * Following PNCP API specification section 2.3 - Complete data mapping
	 * 
	 * @param tender - Raw tender data from PNCP API
	 * @returns Standardized tender object with metadata
	 */
	private transformTenderData(tender: IDataObject): IDataObject {
		const tenderObject = (tender.objetoContratacao as string) || '';
		const estimatedValue = (tender.valorTotalEstimado as number) || 0;
		
		return {
			// Core PNCP fields (section 2.3.1)
			pncpId: tender.numeroControlePNCP || '',
			procuringEntityName: tender.razaoSocial || '',
			procuringEntityCNPJ: tender.cnpjOrgaoEntidade || '',
			tenderObject: tenderObject,
			tenderModality: tender.modalidadeLicitacao || '',
			tenderSituation: tender.situacaoLicitacao || '',
			publicationDate: tender.dataPublicacaoPncp || '',
			proposalOpeningDate: tender.dataAberturaProposta || '',
			estimatedTotalValue: estimatedValue,
			
			// Location and administrative data (section 2.3.2)
			municipalityCode: tender.codigoMunicipio || '',
			municipalityName: tender.municipio || '',
			stateCode: tender.uf || '',
			
			// Legal and procedural information (section 2.3.3)
			legalProcedure: tender.fundamentoLegal || '',
			evaluationCriteria: tender.criterioJulgamento || '',
			participationRegime: tender.regimeExecucao || '',
			
			// Technical specifications (section 2.3.4)
			technicalSpecification: tender.especificacaoTecnica || '',
			deliveryAddress: tender.enderecoEntrega || '',
			contractDuration: tender.prazoExecucao || '',
			
			// Financial details (section 2.3.5)
			currency: tender.moeda || 'BRL',
			budgetDetails: tender.detalhamentoOrcamentario || '',
			paymentConditions: tender.condicoesPagamento || '',
			
			// Generated portal URL for direct access
			portalUrl: this.buildPortalUrl(tender.numeroControlePNCP as string),
			
			// Metadata automáticos (section 2.3.6)
			_extractedAt: new Date().toISOString(),
			_category: this.categorizeTender(tenderObject),
			_riskScore: this.calculateRiskScore(tender),
			_dataQuality: this.assessDataQuality(tender),
			_urgencyLevel: this.calculateUrgencyLevel(tender),
		};
	}

	/**
	 * Categorizes tender based on object description using keyword analysis
	 * Maps to common AEC industry categories for better filtering
	 */
	private categorizeTender(tenderObject: string): string {
		const obj = tenderObject.toLowerCase();
		
		// Infrastructure projects
		if (obj.includes('ponte') || obj.includes('viaduto') || obj.includes('túnel') || 
			obj.includes('rodovia') || obj.includes('estrada') || obj.includes('infraestrutura')) {
			return 'infrastructure';
		}
		
		// Architecture projects  
		if (obj.includes('projeto') || obj.includes('arquitetônico') || obj.includes('arquitetura') ||
			obj.includes('urbanismo') || obj.includes('paisagismo')) {
			return 'architecture';
		}
		
		// Engineering services
		if (obj.includes('engenharia') || obj.includes('estrutural') || obj.includes('geotécnica') ||
			obj.includes('hidráulica') || obj.includes('elétrica') || obj.includes('mecânica')) {
			return 'engineering';
		}
		
		// Construction works
		if (obj.includes('construção') || obj.includes('obra') || obj.includes('edificação') ||
			obj.includes('fundação') || obj.includes('estrutura')) {
			return 'construction';
		}
		
		// Renovation/maintenance
		if (obj.includes('reforma') || obj.includes('modernização') || obj.includes('restauração') ||
			obj.includes('manutenção') || obj.includes('recuperação')) {
			return 'renovation';
		}
		
		// Environmental projects
		if (obj.includes('ambiental') || obj.includes('sustentável') || obj.includes('verde') ||
			obj.includes('energia renovável') || obj.includes('eficiência energética')) {
			return 'environmental';
		}
		
		return 'general';
	}

	/**
	 * Calculates risk score (0-100) based on tender characteristics
	 * Higher scores indicate higher complexity/risk tenders
	 */
	private calculateRiskScore(tender: IDataObject): number {
		let score = 0;
		
		// Value-based risk (40% weight)
		const value = (tender.valorTotalEstimado as number) || 0;
		if (value > 50000000) score += 40; // >50M = high risk
		else if (value > 10000000) score += 30; // 10-50M = medium-high
		else if (value > 1000000) score += 20; // 1-10M = medium  
		else if (value > 100000) score += 10; // 100K-1M = low-medium
		
		// Complexity-based risk (30% weight)
		const obj = ((tender.objetoContratacao as string) || '').toLowerCase();
		if (obj.includes('complexa') || obj.includes('integrada') || obj.includes('sistema')) score += 15;
		if (obj.includes('inovação') || obj.includes('tecnologia') || obj.includes('smart')) score += 10;
		if (obj.includes('múltipla') || obj.includes('diversas') || obj.includes('várias')) score += 5;
		
		// Timeline-based risk (20% weight)
		const publicationDate = tender.dataPublicacaoPncp as string;
		const openingDate = tender.dataAberturaProposta as string;
		if (publicationDate && openingDate) {
			const pubDate = new Date(publicationDate);
			const openDate = new Date(openingDate);
			const daysDiff = (openDate.getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
			
			if (daysDiff < 15) score += 20; // Very short timeline = high risk
			else if (daysDiff < 30) score += 10; // Short timeline = medium risk
		}
		
		// Modality-based risk (10% weight)
		const modality = (tender.modalidadeLicitacao as string) || '';
		if (modality.includes('Concorrência')) score += 10; // Most complex modality
		else if (modality.includes('Tomada de Preços')) score += 5;
		
		return Math.min(100, Math.max(0, score));
	}

	/**
	 * Assesses data quality based on completeness of required fields
	 * Returns quality score from 0-100
	 */
	private assessDataQuality(tender: IDataObject): number {
		const requiredFields = [
			'numeroControlePNCP',
			'razaoSocial', 
			'objetoContratacao',
			'dataPublicacaoPncp',
			'dataAberturaProposta',
			'valorTotalEstimado',
			'modalidadeLicitacao'
		];
		
		const presentFields = requiredFields.filter(field => 
			tender[field] && tender[field] !== '' && tender[field] !== 0
		);
		
		return Math.round((presentFields.length / requiredFields.length) * 100);
	}

	/**
	 * Calculates urgency level based on timeline and tender characteristics
	 * Returns: 'low', 'medium', 'high', 'critical'
	 */
	private calculateUrgencyLevel(tender: IDataObject): string {
		const publicationDate = tender.dataPublicacaoPncp as string;
		const openingDate = tender.dataAberturaProposta as string;
		
		if (!publicationDate || !openingDate) return 'medium';
		
		const now = new Date();
		const openDate = new Date(openingDate);
		const daysUntilOpening = (openDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
		
		// Critical: Less than 7 days or already passed
		if (daysUntilOpening <= 7) return 'critical';
		
		// High: 7-15 days
		if (daysUntilOpening <= 15) return 'high';
		
		// Medium: 15-30 days  
		if (daysUntilOpening <= 30) return 'medium';
		
		// Low: More than 30 days
		return 'low';
	}

	/**
	 * Makes HTTP requests to PNCP API with comprehensive error handling
	 * Implements retry logic for transient errors and proper error mapping
	 * 
	 * @param executeFunctions - n8n execution context
	 * @param endpoint - API endpoint path
	 * @param params - Query parameters
	 * @param retryCount - Current retry attempt (internal use)
	 * @returns Promise<IDataObject> - API response data
	 */
	public async makeAPIRequest(
		executeFunctions: IExecuteFunctions,
		endpoint: string,
		params: IDataObject = {},
		retryCount: number = 0
	): Promise<IDataObject> {
		const baseUrl = 'https://pncp.gov.br/api/consulta/v1';
		const url = `${baseUrl}${endpoint}`;
		const maxRetries = 3;
		const baseDelay = 1000; // 1 second base delay

		// Add request metadata for debugging
		const requestId = `pncp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		const options: IHttpRequestOptions = {
			method: 'GET',
			url,
			qs: params,
			headers: {
				Accept: 'application/json',
				'User-Agent': 'n8n-aec-tenders/0.1.0',
				'X-Request-ID': requestId,
			},
			returnFullResponse: true,
			json: true,
			timeout: 30000, // 30 second timeout
		};

		try {
			const response = await executeFunctions.helpers.httpRequest.call(executeFunctions, options);
			
			// Validate response structure
			if (!response.body) {
				throw new NodeApiError(executeFunctions.getNode(), new Error('Empty response from PNCP API'), {
					message: 'API PNCP retornou resposta vazia',
					description: 'Verifique se os parâmetros da consulta estão corretos'
				});
			}

			return response.body as IDataObject;
			
		} catch (error: any) {
			const httpStatus = error.response?.status || error.statusCode || 0;
			const errorPattern = PNCP_ERROR_PATTERNS[httpStatus];
			
			// Handle known PNCP API errors
			if (errorPattern) {
				// Implement retry logic for retryable errors
				if (errorPattern.retryable && retryCount < maxRetries) {
					const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
					await this.sleep(delay);
					
					return this.makeAPIRequest(executeFunctions, endpoint, params, retryCount + 1);
				}
				
				// Create detailed error for non-retryable or max retry exceeded
				throw new NodeApiError(executeFunctions.getNode(), error, {
					message: `PNCP API Error (${errorPattern.code}): ${errorPattern.message}`,
					description: `${errorPattern.details}\n\nDetalhes técnicos: ${error.message}`,
					httpCode: `${httpStatus}`,
				});
			}
			
			// Handle network and other unknown errors
			if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
				throw new NodeApiError(executeFunctions.getNode(), error, {
					message: 'Não foi possível conectar à API PNCP',
					description: 'Verifique sua conexão com a internet e tente novamente. O serviço pode estar temporariamente indisponível.',
				});
			}
			
			if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
				// Retry timeout errors
				if (retryCount < maxRetries) {
					const delay = baseDelay * Math.pow(2, retryCount);
					await this.sleep(delay);
					
					return this.makeAPIRequest(executeFunctions, endpoint, params, retryCount + 1);
				}
				
				throw new NodeApiError(executeFunctions.getNode(), error, {
					message: 'Timeout na consulta à API PNCP',
					description: 'A requisição demorou muito para ser processada. Tente reduzir o período de consulta ou tente novamente mais tarde.',
				});
			}
			
			// Generic error fallback
			throw new NodeApiError(executeFunctions.getNode(), error, {
				message: `Erro inesperado na API PNCP: ${error.message}`,
				description: `Request ID: ${requestId}\nEndpoint: ${endpoint}\nParâmetros: ${JSON.stringify(params, null, 2)}`,
			});
		}
	}

	/**
	 * Utility method for implementing delays in retry logic
	 * @param ms - Milliseconds to wait
	 */
	private async sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Validates input parameters before making API requests
	 * Prevents common user errors that would result in API failures
	 */
	private validateInputParameters(operation: string, params: IDataObject): void {
		switch (operation) {
			case 'listByPublicationDate':
			case 'searchByKeyword':
				const startDate = params.startDate as string;
				const endDate = params.endDate as string;
				
				if (!startDate || !endDate) {
					throw new NodeOperationError(
						{} as any, // Node reference not needed for validation errors
						'Datas de início e fim são obrigatórias'
					);
				}
				
				// Validate date format (ISO 8601)
				const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3})?Z?)?$/;
				if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
					throw new NodeOperationError(
						{} as any,
						'Formato de data inválido. Use o formato YYYY-MM-DD ou ISO 8601 completo'
					);
				}
				
				// Validate date range (max 1 year to prevent API overload)
				const start = new Date(startDate);
				const end = new Date(endDate);
				const daysDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
				
				if (daysDiff < 0) {
					throw new NodeOperationError(
						{} as any,
						'Data de início deve ser anterior à data de fim'
					);
				}
				
				if (daysDiff > 365) {
					throw new NodeOperationError(
						{} as any,
						'Período máximo de consulta é 1 ano. Reduza o intervalo de datas.'
					);
				}
				break;
				
			case 'getDetailsById':
				const cnpj = params.cnpj as string;
				const year = params.year as number;
				const sequenceNumber = params.sequenceNumber as number;
				
				if (!this.validateCNPJ(cnpj)) {
					throw new NodeOperationError(
						{} as any,
						'CNPJ inválido. Deve conter exatamente 14 dígitos numéricos'
					);
				}
				
				if (!year || year < 2000 || year > new Date().getFullYear() + 1) {
					throw new NodeOperationError(
						{} as any,
						'Ano inválido. Deve estar entre 2000 e o próximo ano'
					);
				}
				
				if (!sequenceNumber || sequenceNumber < 1 || sequenceNumber > 999999) {
					throw new NodeOperationError(
						{} as any,
						'Número sequencial inválido. Deve estar entre 1 e 999999'
					);
				}
				break;
		}
	}

	public async listTendersByDate(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
		const startDate = executeFunctions.getNodeParameter('startDate', itemIndex) as string;
		const endDate = executeFunctions.getNodeParameter('endDate', itemIndex) as string;
		const returnAll = executeFunctions.getNodeParameter('returnAll', itemIndex) as boolean;
		const limit = executeFunctions.getNodeParameter('limit', itemIndex, 50) as number;

		if (!startDate || !endDate) {
			throw new NodeOperationError(executeFunctions.getNode(), 'Start date and end date are required');
		}

		const formattedStartDate = this.formatDate(startDate);
		const formattedEndDate = this.formatDate(endDate);

		let allTenders: IDataObject[] = [];
		let page = 1;
		let hasMorePages = true;

		while (hasMorePages && (returnAll || allTenders.length < limit)) {
			const params = {
				dataInicial: formattedStartDate,
				dataFinal: formattedEndDate,
				pagina: page,
			};

			const response = await this.makeAPIRequest(executeFunctions, '/contratacoes/publicacoes', params);
			const tenders = response.data as IDataObject[] || [];

			if (tenders.length === 0) {
				hasMorePages = false;
			} else {
				const transformedTenders = tenders.map((tender) => this.transformTenderData(tender));
				allTenders.push(...transformedTenders);
				page++;
				
				if (!returnAll && allTenders.length >= limit) {
					allTenders = allTenders.slice(0, limit);
					hasMorePages = false;
				}
			}
		}

		return allTenders;
	}

	public async getTendersWithOpenProposals(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
		const stateUf = executeFunctions.getNodeParameter('stateUf', itemIndex, '') as string;
		const returnAll = executeFunctions.getNodeParameter('returnAll', itemIndex) as boolean;
		const limit = executeFunctions.getNodeParameter('limit', itemIndex, 50) as number;

		let allTenders: IDataObject[] = [];
		let page = 1;
		let hasMorePages = true;

		while (hasMorePages && (returnAll || allTenders.length < limit)) {
			const params: IDataObject = {
				pagina: page,
			};

			if (stateUf) {
				params.uf = stateUf.toUpperCase();
			}

			const response = await this.makeAPIRequest(executeFunctions, '/contratacoes/publicacoes-vigentes', params);
			const tenders = response.data as IDataObject[] || [];

			if (tenders.length === 0) {
				hasMorePages = false;
			} else {
				const transformedTenders = tenders.map((tender) => this.transformTenderData(tender));
				allTenders.push(...transformedTenders);
				page++;
				
				if (!returnAll && allTenders.length >= limit) {
					allTenders = allTenders.slice(0, limit);
					hasMorePages = false;
				}
			}
		}

		return allTenders;
	}

	public async getTenderDetailsById(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
		const cnpj = executeFunctions.getNodeParameter('procuringEntityCNPJ', itemIndex) as string;
		const year = executeFunctions.getNodeParameter('year', itemIndex) as number;
		const sequenceNumber = executeFunctions.getNodeParameter('sequenceNumber', itemIndex) as number;

		if (!this.validateCNPJ(cnpj)) {
			throw new NodeOperationError(executeFunctions.getNode(), 'Invalid CNPJ format. It must contain exactly 14 digits');
		}

		const endpoint = `/contratacoes/publicacao/${cnpj}/${year}/${sequenceNumber}`;
		const response = await this.makeAPIRequest(executeFunctions, endpoint);

		if (!response) {
			throw new NodeOperationError(executeFunctions.getNode(), 'Tender not found with the provided parameters');
		}

		return [this.transformTenderData(response)];
	}

	public async searchTendersByKeyword(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
		const keywords = executeFunctions.getNodeParameter('keywords', itemIndex) as string;
		const returnAll = executeFunctions.getNodeParameter('returnAll', itemIndex) as boolean;
		const limit = executeFunctions.getNodeParameter('limit', itemIndex, 50) as number;

		if (!keywords.trim()) {
			throw new NodeOperationError(executeFunctions.getNode(), 'Keywords are required for search');
		}

		const keywordArray = keywords.split(',').map((k) => k.trim().toLowerCase());
		const allTenders = await this.listTendersByDate(executeFunctions, itemIndex);

		const filteredTenders = allTenders.filter((tender: IDataObject) => {
			const tenderObject = (tender.tenderObject as string || '').toLowerCase();
			return keywordArray.some((keyword) => tenderObject.includes(keyword));
		});

		if (!returnAll && filteredTenders.length > limit) {
			return filteredTenders.slice(0, limit);
		}

		return filteredTenders;
	}
}
