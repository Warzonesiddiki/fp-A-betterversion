import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { BookOpen, GitCompare, Download, Plus } from 'lucide-react';

interface AccountingBook {
  id: string;
  name: string;
  gaap: 'US GAAP' | 'IFRS' | 'Tax' | 'Statutory';
  currency: string;
  entries: number;
  lastUpdated: string;
}

const MOCK_BOOKS: AccountingBook[] = [
  {
    id: '1',
    name: 'US GAAP Book',
    gaap: 'US GAAP',
    currency: 'USD',
    entries: 1250,
    lastUpdated: '2026-05-20',
  },
  {
    id: '2',
    name: 'IFRS Book',
    gaap: 'IFRS',
    currency: 'USD',
    entries: 1180,
    lastUpdated: '2026-05-20',
  },
  {
    id: '3',
    name: 'Tax Book',
    gaap: 'Tax',
    currency: 'USD',
    entries: 890,
    lastUpdated: '2026-05-19',
  },
  {
    id: '4',
    name: 'Statutory Book',
    gaap: 'Statutory',
    currency: 'EUR',
    entries: 720,
    lastUpdated: '2026-05-18',
  },
];

export default function MultiBookPage() {
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const books = MOCK_BOOKS;

  const gaapColors: Record<string, string> = {
    'US GAAP': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    IFRS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Tax: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Statutory: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const toggleBook = (id: string) => {
    setSelectedBooks((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Book Accounting</h1>
          <p className="text-muted-foreground">GAAP, IFRS, Tax, and Statutory books</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Book
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Books"
              value={books.length}
              icon={<BookOpen className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Total Entries" value={books.reduce((s, b) => s + b.entries, 0)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="GAAP Types" value={new Set(books.map((b) => b.gaap)).size} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Currencies" value={new Set(books.map((b) => b.currency)).size} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {books.map((book) => (
          <Card
            key={book.id}
            className={`cursor-pointer transition-all ${selectedBooks.includes(book.id) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => toggleBook(book.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{book.name}</h3>
                  <p className="text-sm text-muted-foreground">{book.entries} entries</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${gaapColors[book.gaap]}`}
                >
                  {book.gaap}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Currency: {book.currency}</span>
                <span className="text-muted-foreground">Updated: {book.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBooks.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitCompare className="h-4 w-4" /> Book Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Comparing {selectedBooks.length} books — side-by-side GAAP differences would appear
              here.
            </p>
            <div className="flex gap-2 mt-4">
              <Button size="sm">Run Consolidation</Button>
              <Button size="sm" variant="outline">
                Export Comparison
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
