# Documentation

This directory contains all documentation for the Open Transit Route Finder project.

## Contents

| Directory | Description |
|-----------|-------------|
| [api/](./api/) | API endpoint documentation and examples |
| [architecture/](./architecture/) | System design and technical architecture |
| [contracts/](./contracts/) | API contracts between frontend and backend |

## Quick Links

- [System Design](./architecture/system_design.md) - High-level architecture overview
- [API Contract](./contracts/api_contract.md) - JSON response specifications

## For Developers

### Backend Developers
Start with the [API Contract](./contracts/api_contract.md) to understand the expected response formats, then refer to [System Design](./architecture/system_design.md) for implementation details.

### Frontend Developers
The [API Contract](./contracts/api_contract.md) defines exactly what data you'll receive from each endpoint. Use this to build mock data for development.

## Contract-First Development

This project follows a contract-first approach:

1. **Define the contract** - Agree on JSON structure in `contracts/`
2. **Develop in parallel** - Frontend uses mocks, backend implements real data
3. **Integrate** - Connect frontend to backend once both match the contract
4. **Test** - Verify responses match the documented contracts
