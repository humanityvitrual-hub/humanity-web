import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-semibold">About Humanity</h1>
        <p className="mt-4 text-neutral-300">
          Humanity es una plataforma para crear tu propio mundo digital.
          Este MVP sienta las bases de arquitectura, diseño y despliegue
          continuo en la nube.
        </p>
      </main>
      <Footer />
    </>
  );
}
