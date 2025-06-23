import Layout from '../components/Layout';
import TransactionList from '../components/TransactionList';
import FinancialSummary from '../components/FinancialSummary';

const mockTransactions = [
  { id: 1, description: 'Salario Mensual', amount: 3000, type: 'income', date: '2025-06-23' },
  { id: 2, description: 'Alquiler', amount: 1200, type: 'expense', date: '2025-06-22' },
  { id: 3, description: 'Compra en supermercado', amount: 150, type: 'expense', date: '2025-06-21' },
  { id: 4, description: 'Venta de item online', amount: 75, type: 'income', date: '2025-06-20' },
];

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Aquí tienes un resumen de tu actividad financiera.
          </p>
        </div>
        <FinancialSummary transactions={mockTransactions} />
        <TransactionList transactions={mockTransactions} />
      </div>
    </Layout>
  );
}


