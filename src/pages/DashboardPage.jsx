import Layout from '../components/Layout';
import TransactionList from '../components/TransactionList';

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
        <TransactionList />
      </div>
    </Layout>
  );
}

