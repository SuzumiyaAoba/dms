import { apiServer } from '@/shared/api';
import { DocumentsPageClient } from './DocumentsPageClient';

interface DocumentsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page || '1', 10);
  const limit = 20;

  let documents: Awaited<ReturnType<typeof apiServer.listDocuments>> | null = null;
  let error: string | null = null;

  try {
    documents = await apiServer.listDocuments(page, limit);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return <DocumentsPageClient documents={documents} error={error} page={page} />;
}
