# Universal Gacha Tracking Service

## Project Overview
Full-stack Node.js application for tracking Honkai Star Rail and Genshin Impact gacha pulls with modern web interface.

## Architecture
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Express.js + TypeScript + Prisma ORM  
- Database: MySQL 8.0 in Docker
- Containerization: Docker Compose
- Data Import: HSR and Genshin Impact gacha data integration

## Key Components

### Frontend Structure
- Modern React components with TypeScript
- TailwindCSS for styling
- Authentication context and protected routes
- Image optimization and fallback handling
- Responsive layout system

### Backend Features
- RESTful API with Express
- Prisma ORM for database operations
- Authentication middleware
- Cache system for optimization
- Image processing middleware
- Logging system with different levels
- Data import and analysis scripts

### Database Design
- User management system with roles
- Banner tracking and history
- Item mappings and translations
- Settings management
- Migration system with Prisma

### Key Features
- Multi-language support (EN/RU)
- Banner management system
- User authentication and authorization
- Statistical analysis
- Image optimization and caching
- Data import from game clients
- Admin panel functionality

### Utility Scripts
- Game URL extractors
- Data analyzers
- Database management tools
- Cache management
- Translation tools

### Development Tools
- Docker development environment
- VS Code configuration
- Automated tasks
- TypeScript configuration
- Development workflows

## Project Structure
```
/
├── client/                 # Frontend React application
├── server/                 # Backend Express application
├── database/              # Database initialization
├── scripts/               # Utility scripts
└── logs/                  # Application logs
```

## Progress Status
- [x] Core functionality implemented
- [x] Authentication system
- [x] Database schema and migrations
- [x] API endpoints
- [x] Frontend components
- [x] Image handling
- [x] Multi-language support
- [x] Admin functionality

## Development Guidelines
- Use TypeScript for type safety
- Follow REST API principles
- Implement proper error handling
- Maintain consistent logging
- Use proper caching strategies
- Follow security best practices