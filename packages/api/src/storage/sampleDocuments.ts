/**
 * Sample documents used for development seeding.
 *
 * @module storage/sampleDocuments
 */

import type { CreateDocument } from '../types/document';

/**
 * Default sample documents to populate storage during development.
 */
export const SAMPLE_DOCUMENTS: CreateDocument[] = [
  {
    title: 'Getting Started Guide',
    content:
      'Welcome to the Document Management System! This guide will help you get started with managing your documents.',
  },
  {
    title: 'API Documentation',
    content:
      'This document describes the API endpoints available in the DMS. Use the /api/v1 prefix for all API calls.',
  },
  {
    title: 'Project Roadmap',
    content:
      'Our project roadmap includes implementing LLM-powered search, document versioning, and collaboration features.',
  },
];
