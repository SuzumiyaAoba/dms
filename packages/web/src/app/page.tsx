import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        DMS - Document Management System
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.125rem' }}>
        ドキュメント管理システムへようこそ
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link
          href="/documents"
          style={{
            display: 'block',
            padding: '1rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          ドキュメント一覧を見る
        </Link>

        <Link
          href="/api-test"
          style={{
            display: 'block',
            padding: '1rem 1.5rem',
            background: '#6b7280',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          API接続テスト
        </Link>
      </div>
    </main>
  );
}
