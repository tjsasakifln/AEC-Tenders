# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-13

### Added

#### Core Features
- **AEC Tenders n8n Custom Node**: Complete implementation for Brazil's PNCP API integration
- **Four Primary Operations**:
  - `listByPublicationDate`: Retrieve tenders published within a date range
  - `listWithOpenProposals`: Get tenders currently accepting proposals
  - `getDetailsById`: Fetch detailed information for specific tender
  - `searchByKeyword`: Search tenders by keywords in contract objects

#### Data Processing & Enrichment
- **Enhanced Tender Schema**: Complete mapping of PNCP API response fields
- **Automatic Metadata Generation**:
  - `_extractedAt`: Timestamp of data extraction
  - `_category`: Intelligent categorization (infrastructure, architecture, engineering, construction, renovation, environmental, general)
  - `_riskScore`: Risk assessment based on value, complexity, and timeline (0-100 scale)
  - `_dataQuality`: Completeness assessment of required fields (0-100 percentage)
  - `_urgencyLevel`: Timeline-based urgency classification (low, medium, high, critical)
- **Portal URL Generation**: Direct links to PNCP tender details

#### Error Handling & Reliability
- **PNCP-Specific Error Handling**: Comprehensive error mapping for all HTTP status codes
- **Retry Logic**: Exponential backoff for transient errors (429, 500, 502, 503, 504)
- **Input Validation**: Pre-request validation for CNPJ format, date ranges, and required parameters
- **Request Tracking**: Unique request IDs for debugging and monitoring

#### Testing Infrastructure
- **Jest Test Suite**: Complete test coverage for all utility functions and API integrations
- **Mock Infrastructure**: Comprehensive mocking for n8n interfaces and HTTP requests
- **Coverage Reporting**: Detailed test coverage reports with HTML and LCOV formats

#### Project Configuration
- **TypeScript Configuration**: Strict typing with proper n8n workflow interfaces
- **Package Configuration**: Complete package.json with all required dependencies and metadata
- **Documentation**: Professional README with SEO optimization for 2025

### Technical Implementation

#### API Integration
- **Base URL**: `https://pncp.gov.br/api/consulta/v1`
- **Request Timeout**: 30 seconds with retry capability
- **Pagination Support**: Automatic handling for large result sets
- **User Agent**: `n8n-aec-tenders/0.1.0` for proper API identification

#### Data Transformation
- **Field Mapping**: Complete PNCP field mapping following API specification section 2.3
- **Smart Categorization**: Keyword-based tender categorization for AEC industry filtering
- **Risk Assessment**: Multi-factor risk scoring algorithm considering value, complexity, and timeline
- **Data Quality Assessment**: Automated quality scoring based on field completeness

#### Performance & Scalability
- **Efficient Pagination**: Optimized pagination handling for large datasets
- **Memory Management**: Streaming approach for large result sets
- **Error Recovery**: Graceful degradation with detailed error reporting

### Dependencies

#### Production Dependencies
- `n8n-workflow`: ^1.68.0 (Core n8n interfaces and utilities)

#### Development Dependencies
- `jest`: ^29.7.0 (Testing framework)
- `ts-jest`: ^29.1.1 (TypeScript support for Jest)
- `@types/jest`: ^29.5.8 (TypeScript definitions for Jest)
- `typescript`: ^5.3.2 (TypeScript compiler)

### Supported Node.js Versions
- Node.js 16.x or higher
- Compatible with n8n 1.0+ versions

### Author
- **Tiago Sasaki** <tiago@confenge.com.br>
- **GitHub Repository**: [tjsasakifln/n8n-nodes-aec-tenders](https://github.com/tjsasakifln/n8n-nodes-aec-tenders)

### License
- MIT License

---

## Upcoming Releases

### [0.2.0] - Planned
- Enhanced filtering options
- Additional tender status tracking
- Performance optimizations
- Extended test coverage

### [0.3.0] - Planned
- Real-time notifications
- Advanced analytics and reporting
- Integration with additional Brazilian government APIs
- Enhanced data visualization options