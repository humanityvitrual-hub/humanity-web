import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="relative isolate">
        {/* Fondo sutil */}
        <div className="absolute inset-0 -z-10 bg-grid" />
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col items-center justify-center gap-8 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Your Own World
          </h1>
          <p className="max-w-2xl text-neutral-300">
            Crea y explora tu propio mundo digital. Construimos la base
            para experiencias personalizadas y escalables.
          </p>

          <div className="mt-2 flex items-center gap-4">
            <Button asLink href="/auth/sign-in">Enter My World</Button>
            <Button asLink href="/about" variant="ghost">
              Learn More
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
