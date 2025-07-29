# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Harvey is a React dashboard application built with TypeScript and Vite that provides organizational usage analytics and monitoring. It appears to be designed as a Langfuse organizational dashboard for tracking AI agent usage, costs, and performance across departments and users.

## Development Commands

- **Development server**: `npm run dev`
- **Build**: `npm run build` (runs TypeScript compilation then Vite build)
- **Lint**: `npm run lint` (ESLint with TypeScript support)
- **Test**: `npm run test` (Vitest)
- **Preview**: `npm run preview` (preview built application)

## Architecture Overview

### Core Structure
- **Frontend**: React 19 with TypeScript, routing via React Router DOM
- **Styling**: Tailwind CSS v4 with custom design system components
- **Build Tool**: Vite with path aliases (`@/` → `src/`)
- **Data Layer**: Mock data service with comprehensive type definitions
- **Testing**: Vitest for unit testing

### Key Directories
- `src/components/`: UI components organized by feature (charts, tables, analysis, etc.)
- `src/pages/`: Route-level components (Dashboard, BlankPage)
- `src/services/`: Data service layer with mock data implementation
- `src/types/`: Comprehensive TypeScript definitions for the domain model
- `src/data/mockData/`: Mock data generation and storage

### Component Architecture
The application uses a modular component structure:
- **Layout Components**: `DashboardLayout`, `DashboardSection` provide consistent structure
- **Feature Components**: Specialized components for charts, tables, analysis views
- **UI Components**: Reusable design system components in `ui/` directory
- **Filter System**: Centralized filtering with `FilterControls` and `FilterState`

### Data Model
The application centers around these core entities:
- **Department**: Organizational units with budgets and spending tracking
- **User**: Individual users with usage analytics and agent interactions  
- **Agent**: AI agents (Pre-built, DIY, Foundation) with cost and popularity metrics
- **Session**: Individual usage sessions with cost, token count, and status tracking

### Mock Data System
- Uses a sophisticated mock data service (`dataService.ts`) that simulates real API behavior
- Includes pagination, filtering, error simulation, and realistic data generation
- Store pattern with comprehensive data fixtures and generators

## Code Conventions

### TypeScript
- Strict TypeScript configuration with path mapping
- Comprehensive interface definitions in `src/types/index.ts`
- React 19 with proper typing for components and hooks

### Styling
- Tailwind CSS v4 with custom design tokens
- Component-based styling with consistent spacing and color schemes
- Responsive design with mobile-first approach (`lg:` breakpoints for desktop)

### State Management
- React hooks (`useState`, `useCallback`) for local state
- Filter state management pattern for dashboard interactions
- Service layer pattern for data operations

### Testing
- Vitest configuration for unit testing
- Test files located in `src/services/__tests__/`