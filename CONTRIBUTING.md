# Contributing to n8n AEC Tenders Node

Thank you for your interest in contributing to the n8n AEC Tenders Node! This document provides guidelines for contributing to this project.

## Getting Started

### Prerequisites

- Node.js 20.15 or higher
- npm 9.5 or higher
- Basic knowledge of TypeScript and n8n node development

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/tjsasakifln/AEC-Tenders.git
cd n8n-nodes-aec-tenders
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Development Workflow

### Code Style

We use ESLint with n8n-specific rules. Before submitting any code:

```bash
npm run lint
npm run lintfix  # Auto-fix issues where possible
```

### Testing

All new features and bug fixes must include tests:

- **Unit tests**: Add to `tests/utils.test.ts` for utility functions
- **Integration tests**: Add to `tests/api-integration.test.ts` for API interactions

Run tests with:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Building

Build the project before testing in n8n:
```bash
npm run build
```

## Contributing Guidelines

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow conventional commit format:
- `feat: add new tender filtering capability`
- `fix: resolve CNPJ validation issue`
- `docs: update API documentation`
- `test: add unit tests for risk calculation`

### Pull Request Process

1. **Fork the repository** and create your feature branch
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all tests pass**: `npm test`
6. **Ensure code passes linting**: `npm run lint`
7. **Build successfully**: `npm run build`
8. **Create a pull request** with a clear description

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Provide proper type definitions
- Follow n8n naming conventions
- Document complex functions with JSDoc

### API Integration

- Always validate input parameters
- Implement proper error handling
- Use appropriate HTTP status code handling
- Include request tracking for debugging

### Testing

- Test both success and error scenarios
- Mock external API calls appropriately
- Maintain good test coverage (>80%)
- Use descriptive test names

## PNCP API Guidelines

When working with the PNCP API:

1. **Rate Limiting**: Respect API rate limits
2. **Error Handling**: Handle all documented error codes
3. **Data Validation**: Validate CNPJ format and date ranges
4. **Endpoint Usage**: Use correct API endpoints
5. **Field Mapping**: Map API response fields accurately

## Documentation

### Code Documentation

- Document all public methods with JSDoc
- Include parameter descriptions and return types
- Provide examples for complex functionality

### User Documentation

- Update README.md for new features
- Add examples to the examples/ directory
- Update CHANGELOG.md following semantic versioning

## Security

- Never commit API keys or credentials
- Validate all user inputs
- Use HTTPS for all API communications
- Follow n8n security best practices

## Performance

- Implement pagination for large datasets
- Use appropriate timeout values
- Optimize data transformation logic
- Consider memory usage for large responses

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Ensure all tests pass
4. Create release tag
5. Publish to npm registry

## Getting Help

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the README.md and code comments

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

Thank you for contributing to the n8n AEC Tenders Node! 🚀