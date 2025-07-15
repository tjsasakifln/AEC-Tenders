# 🏗️ n8n-nodes-pncp-aec | Brazilian Public Procurement Automation 2025

**PNCP Integration for n8n** | Transform tender monitoring into intelligent workflows

[![n8n compatibility](https://img.shields.io/badge/n8n-v1.82%2B-brightgreen)](https://n8n.io)
[![Node.js version](https://img.shields.io/badge/node-%3E%3D20.15-blue)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-tjsasakifln%2FAEC--Tenders-blue)](https://github.com/tjsasakifln/AEC-Tenders)

Fully automate your search for **Brazilian public tenders** with this premium n8n integration. Connect directly to the **National Public Procurement Portal (PNCP)** and transform opportunities into structured data for your **AEC** (Architecture, Engineering and Construction) workflows.

## 🚀 Why use this node in 2025?

✅ **AI-Ready**: Structured data ready for analysis with ChatGPT, Claude and LLM models  
✅ **Zero-Code Automation**: Intuitive visual interface, no programming required  
✅ **Real-time Monitoring**: 24/7 monitoring of new tenders with webhooks  
✅ **Multi-integration**: Connects with Slack, Teams, WhatsApp, CRM, Google Sheets, Notion  
✅ **2025 Compliance**: Updated with the latest Brazilian government APIs  

## 🎯 Main Operations

### 📊 **List by Publication Date** - Temporal Monitoring
Track tenders by specific period, ideal for:
- Automated monthly reports
- New publication alerts
- Market trend analysis

### 🔥 **List with Open Proposals** - Active Opportunities  
Find tenders open for proposals with:
- Geographic filter by state (UF)
- Calendar integration (deadline alerts)
- Real-time push notifications

### 🎲 **Get Details by ID** - Detailed Analysis
Extract complete information using:
- Procuring entity CNPJ
- Year and sequential number
- Technical data for decision making

### 🔍 **Search by Keyword** - Smart Search
Advanced search algorithm by:
- Keywords in procurement object
- Local semantic filters
- Automatic categorization by sector

## ⚡ Quick Installation (3 minutes)

### Via NPM (Recommended)
```bash
# Install globally
npm install -g n8n-nodes-pncp-aec

# Or install locally in your n8n project
npm install n8n-nodes-pncp-aec
```

### Manual Installation for Development
```bash
# 1. Clone and configure
git clone https://github.com/tjsasakifln/AEC-Tenders.git
cd n8n-nodes-aec-tenders && npm install && npm run build

# 2. Local link to n8n
npm link && cd ~/.n8n/custom && npm link n8n-nodes-aec-tenders

# 3. Start n8n
n8n start
```

## 💡 Advanced Use Cases 2025

### 🤖 **AI-Powered Workflow**: Intelligent Analysis + Notion Database
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
        "keywords": "artificial intelligence, sustainability, smart cities, renewable energy",
        "returnAll": false,
        "limit": 50
      },
      "type": "n8n-nodes-aec-tenders.aecTenders",
      "name": "🔍 PNCP Scanner"
    },
    {
      "parameters": {
        "model": "gpt-4-turbo",
        "prompt": "Analyze this tender and classify by: innovation potential (1-10), technical complexity (low/medium/high), and success probability for an engineering company (%). Tender: {{$json.tenderObject}}"
      },
      "type": "n8n-nodes-base.openAi",
      "name": "🧠 AI Analysis"
    },
    {
      "parameters": {
        "database": "Tenders 2025 - Pipeline",
        "properties": {
          "Name": "={{$json.procuringEntityName}}",
          "Object": "={{$json.tenderObject}}", 
          "Value": "={{$json.estimatedTotalValue}}",
          "Opening": "={{$json.proposalOpeningDate}}",
          "AI Score": "={{$json.aiAnalysis}}",
          "URL": "={{$json.portalUrl}}"
        }
      },
      "type": "n8n-nodes-base.notion",
      "name": "📊 Notion CRM"
    }
  ]
}
```

### 📱 **Mobile-First Workflow**: WhatsApp Business + Alerts
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
        "message": "🚨 *NEW TENDERS SP*\n\n{{$json.procuringEntityName}}\n💰 R$ {{$json.estimatedTotalValue}}\n📅 Deadline: {{$json.proposalOpeningDate}}\n🔗 {{$json.portalUrl}}"
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
        "dataset": "tenders-q1-2025",
        "data": "={{$json}}"
      },
      "type": "n8n-nodes-base.microsoftPowerBi"
    }
  ]
}
```

## 📊 Optimized Data Schema (2025)

```typescript
interface TenderData {
  pncpId: string;              // Unique PNCP identifier
  procuringEntityName: string; // Procuring entity name  
  tenderObject: string;        // Procurement object
  publicationDate: string;     // Publication date (ISO 8601)
  proposalOpeningDate: string; // Proposal opening date
  estimatedTotalValue: number; // Estimated value (BRL)
  portalUrl: string;          // Direct PNCP link
  
  // Automatic metadata
  _extractedAt: string;       // Extraction timestamp
  _category?: string;         // AI-generated category
  _riskScore?: number;        // Risk score (0-100)
}
```

## 🔐 Security & Compliance

- ✅ **LGPD Compliant**: No personal data storage
- ✅ **Rate Limiting**: Respects PNCP API limits  
- ✅ **Error Recovery**: Automatic retry with exponential backoff
- ✅ **Audit Trail**: Structured logs for compliance
- ✅ **HTTPS Only**: End-to-end encrypted communication

## 🌟 Roadmap

| Completed ✅ | In Development 🔄 | Planned 📅 |
|---|---|---|
| PNCP API Integration | Performance improvements | Notification system |
| 4 main operations | Expanded documentation | Advanced filters |
| Data validation | Automated testing | Smart caching |

## 🤝 Technical Support

- 📧 **Email**: tiago@confenge.com.br
- 📱 **Issues**: [GitHub Issues](https://github.com/tjsasakifln/AEC-Tenders/issues)

## 🌍 Global Compatibility

| Environment | Status | Minimum Version |
|----------|--------|---------------|
| **n8n Cloud** | ✅ Supported | v1.82.0+ |
| **n8n Self-hosted** | ✅ Supported | v1.82.0+ |
| **Node.js** | ✅ LTS | v20.15+ |
| **Docker** | ✅ Containers | latest |
| **Kubernetes** | ✅ Helm Charts | v1.25+ |

## 📄 License & Credits

**MIT License** © 2025 Tiago Sasaki

Developed with ❤️ for the Brazilian engineering community by [Tiago Sasaki](https://github.com/tjsasakifln) - Automation and AI Specialist.

---

### 🔥 **Accelerate your growth in 2025 - Clone and configure!**

```bash
git clone https://github.com/tjsasakifln/AEC-Tenders.git
cd n8n-nodes-aec-tenders && npm install && npm run build
```

**Tags**: `brazilian-tenders` `pncp-api` `n8n-automation` `aec-tools` `govtech-2025` `no-code` `workflow-automation` `construction-tech` `procurement-api` `smart-cities`