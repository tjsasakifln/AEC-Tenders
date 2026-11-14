# AEC-Tenders | PNCP integration for n8n

A TypeScript community-node project that connects **n8n** workflows to Brazil's **Portal Nacional de Contratações Públicas (PNCP)** consultation API. It helps engineering, construction and procurement teams retrieve public tender records for subsequent filtering, review and workflow automation.

[Node implementation](nodes/AecTenders/AecTenders.node.ts) · [Tests](tests/) · [Package manifest](package.json) · [License](LICENSE.md) · [Maintainer portfolio](https://github.com/tjsasakifln/devflow/blob/main/PORTFOLIO.md)

## Scope visible in the code

The node declares four operations:

| Operation | Purpose |
| --- | --- |
| List by publication date | Retrieve tenders published within an input date interval |
| List with open proposals | Retrieve published opportunities with open proposal windows |
| Get by ID | Query a tender with its identifying fields |
| Search by keyword | Search tender text based on keywords and a selected date interval |

The implementation includes PNCP request construction, input handling and HTTP error/retry logic. It uses data published by the external PNCP service; **availability, completeness and update frequency are outside this project's control**.

This is a connector, not an independently hosted tender-monitoring service. Scheduling, alerts, messaging, storage, CRM updates and downstream analysis require workflows and integrations configured by the operator.

## Technology and code navigation

- **Language:** TypeScript.
- **Runtime and ecosystem:** Node.js 20.15+ and n8n community-node interfaces, as declared in [package.json](package.json).
- **Implementation:** [nodes/AecTenders/AecTenders.node.ts](nodes/AecTenders/AecTenders.node.ts).
- **Verification assets:** [tests](tests/) and package scripts for build, lint and Jest tests.
- **Package name:** `n8n-nodes-pncp-aec`, version `0.1.2` in the repository manifest.

## Build and test locally

```bash
git clone https://github.com/tjsasakifln/AEC-Tenders.git
cd AEC-Tenders
npm ci
npm run build
npm test
npm run lint
```

These commands are provided for reproduction; **their presence does not mean that they passed in every environment or that an external PNCP endpoint is currently available**.

The package manifest declares `n8n-nodes-pncp-aec` for publication. Confirm availability and compatibility with your n8n installation before using a registry installation command. Development and production deployments should follow the [n8n community-node documentation](https://docs.n8n.io/integrations/community-nodes/).

## Reliability and security boundaries

- The node processes public tender information returned by the PNCP API. Verify the official source when making legal, procurement or financial decisions.
- Retries and error mappings are implemented, but successful delivery and uninterrupted access are not guaranteed.
- The repository does not itself provide 24/7 hosting, outbound alerts, a CRM, or a commercial support commitment.
- Treat identifiers, API responses and downstream contact information according to applicable data protection and platform policies.
- Verify credentials and workflow permissions in your own n8n environment. Do not commit secrets.

## Why this is relevant

This project demonstrates how a narrow domain integration can connect public procurement data to programmable workflows. It combines domain-specific data modeling, API integration, TypeScript and n8n interfaces. For related engineering and software work, see the [maintainer's selected portfolio](https://github.com/tjsasakifln/devflow/blob/main/PORTFOLIO.md).

## License

[MIT](LICENSE.md).
