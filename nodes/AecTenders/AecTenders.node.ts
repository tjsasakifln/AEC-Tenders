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

	private transformTenderData(tender: IDataObject): IDataObject {
		return {
			pncpId: tender.numeroControlePNCP || '',
			procuringEntityName: tender.razaoSocial || '',
			tenderObject: tender.objetoContratacao || '',
			publicationDate: tender.dataPublicacaoPncp || '',
			proposalOpeningDate: tender.dataAberturaProposta || '',
			estimatedTotalValue: tender.valorTotalEstimado || 0,
			portalUrl: this.buildPortalUrl(tender.numeroControlePNCP as string),
		};
	}

	public async makeAPIRequest(
		executeFunctions: IExecuteFunctions,
		endpoint: string,
		params: IDataObject = {},
	): Promise<IDataObject> {
		const baseUrl = 'https://pncp.gov.br/api/consulta/v1';
		const url = `${baseUrl}${endpoint}`;

		const options: IHttpRequestOptions = {
			method: 'GET',
			url,
			qs: params,
			headers: {
				Accept: 'application/json',
			},
			returnFullResponse: true,
			json: true,
		};

		try {
			const response = await executeFunctions.helpers.httpRequest.call(executeFunctions, options);
			return response.body as IDataObject;
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), error, {
				message: `Failed to fetch data from PNCP API: ${error.message}`,
			});
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
