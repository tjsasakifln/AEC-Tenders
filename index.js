// n8n community node package entry point
// n8n loads nodes directly from the package.json n8n.nodes configuration
// This file exists only to satisfy npm's requirement for a main entry point

module.exports = {
	name: 'n8n-nodes-aec-tenders',
	description: 'n8n node for fetching public construction tenders from Brazil\'s PNCP',
	version: require('./package.json').version
};