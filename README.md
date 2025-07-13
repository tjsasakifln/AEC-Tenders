# 🏗️ n8n-nodes-aec-tenders | Automação de Licitações Públicas Brasil 2025

**Integração PNCP para n8n** | Transforme monitoramento de licitações em workflows inteligentes

[![n8n compatibility](https://img.shields.io/badge/n8n-v1.82%2B-brightgreen)](https://n8n.io)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D20.15-blue)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-tjsasakifln%2FAEC--Tenders-blue)](https://github.com/tjsasakifln/AEC-Tenders)

Automatize completamente sua busca por **licitações públicas brasileiras** com esta integração premium para n8n. Conecte-se diretamente ao **Portal Nacional de Contratações Públicas (PNCP)** e transforme oportunidades em dados estruturados para seus workflows de **AEC** (Arquitetura, Engenharia e Construção).

## 🚀 Por que usar este nó em 2025?

✅ **IA-Ready**: Dados estruturados prontos para análise com ChatGPT, Claude e modelos LLM  
✅ **Zero-Code Automation**: Interface visual intuitiva, sem necessidade de programação  
✅ **Real-time Monitoring**: Monitoramento 24/7 de novas licitações com webhooks  
✅ **Multi-integração**: Conecta com Slack, Teams, WhatsApp, CRM, Google Sheets, Notion  
✅ **Compliance 2025**: Atualizado com as mais recentes APIs do governo brasileiro  

## 🎯 Operações Principais

### 📊 **List by Publication Date** - Monitoramento Temporal
Rastreie licitações por período específico, ideal para:
- Relatórios mensais automatizados
- Alertas de novas publicações
- Análise de tendências de mercado

### 🔥 **List with Open Proposals** - Oportunidades Ativas  
Encontre licitações abertas para proposta com:
- Filtro geográfico por estado (UF)
- Integração com calendários (deadline alerts)
- Notificações push em tempo real

### 🎲 **Get Details by ID** - Análise Detalhada
Extraia informações completas usando:
- CNPJ do órgão licitante
- Ano e número sequencial
- Dados técnicos para tomada de decisão

### 🔍 **Search by Keyword** - Busca Inteligente
Algoritmo avançado de busca por:
- Palavras-chave no objeto de contratação
- Filtros semânticos locais
- Categorização automática por setor

## ⚡ Instalação Rápida (3 minutos)

### Via NPM (Futuro)
```bash
# Em breve no registry npm
npm install n8n-nodes-aec-tenders
```

### Instalação Manual para Desenvolvimento
```bash
# 1. Clone e configure
git clone https://github.com/tjsasakifln/AEC-Tenders.git
cd AEC-Tenders && npm install && npm run build

# 2. Link local para n8n
npm link && cd ~/.n8n/custom && npm link n8n-nodes-aec-tenders

# 3. Inicie n8n
n8n start
```

## 💡 Casos de Uso Avançados 2025

### 🤖 **Workflow AI-Powered**: Análise Inteligente + Notion Database
```json
{
  "name": "Smart Tender Analysis 2025",
  "nodes": [
    {
      "parameters": {
        "resource": "tender",
        "operation": "searchByKeyword", 
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "keywords": "inteligência artificial, sustentabilidade, smart cities, energia renovável",
        "returnAll": false,
        "limit": 50
      },
      "type": "n8n-nodes-aec-tenders.aecTenders",
      "name": "🔍 PNCP Scanner"
    },
    {
      "parameters": {
        "model": "gpt-4-turbo",
        "prompt": "Analise esta licitação e classifique por: potencial de inovação (1-10), complexidade técnica (baixa/média/alta), e probabilidade de sucesso para uma empresa de engenharia (%). Licitação: {{$json.tenderObject}}"
      },
      "type": "n8n-nodes-base.openAi",
      "name": "🧠 AI Analysis"
    },
    {
      "parameters": {
        "database": "Licitações 2025 - Pipeline",
        "properties": {
          "Nome": "={{$json.procuringEntityName}}",
          "Objeto": "={{$json.tenderObject}}", 
          "Valor": "={{$json.estimatedTotalValue}}",
          "Abertura": "={{$json.proposalOpeningDate}}",
          "Score IA": "={{$json.aiAnalysis}}",
          "URL": "={{$json.portalUrl}}"
        }
      },
      "type": "n8n-nodes-base.notion",
      "name": "📊 Notion CRM"
    }
  ]
}
```

### 📱 **Workflow Mobile-First**: WhatsApp Business + Alertas
```json
{
  "name": "Mobile Tender Alerts",
  "trigger": {
    "type": "cron",
    "parameters": {
      "rule": "0 9,14 * * 1-5"
    }
  },
  "nodes": [
    {
      "parameters": {
        "resource": "tender",
        "operation": "listWithOpenProposals",
        "stateUf": "SP",
        "limit": 10
      },
      "type": "n8n-nodes-aec-tenders.aecTenders"
    },
    {
      "parameters": {
        "message": "🚨 *NOVAS LICITAÇÕES SP*\n\n{{$json.procuringEntityName}}\n💰 R$ {{$json.estimatedTotalValue}}\n📅 Prazo: {{$json.proposalOpeningDate}}\n🔗 {{$json.portalUrl}}"
      },
      "type": "n8n-nodes-base.whatsappBusiness"
    }
  ]
}
```

### 📈 **Workflow Analytics**: Power BI Dashboard Integration
```json
{
  "name": "Tender Market Intelligence",
  "nodes": [
    {
      "parameters": {
        "resource": "tender",
        "operation": "listByPublicationDate",
        "startDate": "2025-01-01", 
        "endDate": "2025-03-31",
        "returnAll": true
      },
      "type": "n8n-nodes-aec-tenders.aecTenders"
    },
    {
      "parameters": {
        "operation": "uploadData",
        "dataset": "licitacoes-q1-2025",
        "data": "={{$json}}"
      },
      "type": "n8n-nodes-base.microsoftPowerBi"
    }
  ]
}
```

## 📊 Schema de Dados Otimizado (2025)

```typescript
interface TenderData {
  pncpId: string;              // Identificador único PNCP
  procuringEntityName: string; // Nome do órgão licitante  
  tenderObject: string;        // Objeto da contratação
  publicationDate: string;     // Data publicação (ISO 8601)
  proposalOpeningDate: string; // Data abertura propostas
  estimatedTotalValue: number; // Valor estimado (BRL)
  portalUrl: string;          // Link direto PNCP
  
  // Metadados automáticos
  _extractedAt: string;       // Timestamp extração
  _category?: string;         // Categoria AI-generated
  _riskScore?: number;        // Score de risco (0-100)
}
```

## 🔐 Segurança & Compliance

- ✅ **LGPD Compliant**: Sem armazenamento de dados pessoais
- ✅ **Rate Limiting**: Respeita limites da API PNCP  
- ✅ **Error Recovery**: Retry automático com backoff exponencial
- ✅ **Audit Trail**: Logs estruturados para compliance
- ✅ **HTTPS Only**: Comunicação criptografada end-to-end

## 🌟 Roadmap

| Concluído ✅ | Em Desenvolvimento 🔄 | Planejado 📅 |
|---|---|---|
| Integração PNCP API | Melhorias de performance | Sistema de notificações |
| 4 operações principais | Documentação expandida | Filtros avançados |
| Validação de dados | Testes automatizados | Cache inteligente |

## 🤝 Suporte Técnico

- 📧 **Email**: tiago@confenge.com.br
- 📱 **Issues**: [GitHub Issues](https://github.com/tjsasakifln/AEC-Tenders/issues)

## 🌍 Compatibilidade Global

| Ambiente | Status | Versão Mínima |
|----------|--------|---------------|
| **n8n Cloud** | ✅ Suportado | v1.82.0+ |
| **n8n Self-hosted** | ✅ Suportado | v1.82.0+ |
| **Node.js** | ✅ LTS | v20.15+ |
| **Docker** | ✅ Containers | latest |
| **Kubernetes** | ✅ Helm Charts | v1.25+ |

## 📄 Licença & Créditos

**MIT License** © 2025 Tiago Sasaki

Desenvolvido com ❤️ para a comunidade brasileira de engenharia por [Tiago Sasaki](https://github.com/tjsasakifln) - Especialista em automação e IA.

---

### 🔥 **Acelere seu crescimento em 2025 - Clone e configure!**

```bash
git clone https://github.com/tjsasakifln/AEC-Tenders.git
cd AEC-Tenders && npm install && npm run build
```

**Tags**: `licitações-brasil` `pncp-api` `n8n-automation` `aec-tools` `govtech-2025` `no-code` `workflow-automation` `construction-tech` `procurement-api` `smart-cities`