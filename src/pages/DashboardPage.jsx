import Layout from '../components/Layout';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-neutral-900 sm:text-5xl md:text-6xl">
          <span className="block">Bienvenido a</span>
          <span className="block text-primary">FinanzasJR v3</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-neutral-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          ¡Tu sesión ha sido iniciada correctamente! Estamos construyendo la mejor experiencia para ti.
        </p>
        
      </div>
    </Layout>
  );
}
