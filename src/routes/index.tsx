import { createFileRoute } from "@tanstack/react-router";
import { LiveApp } from "@/components/rapidez/LiveApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="stage">
      <div className="stage-flank stage-flank-left" aria-hidden="true" />
      <div className="stage-flank stage-flank-right" aria-hidden="true" />
      <LiveApp />
      <p className="stage-note">
        Rapidez · Mototaxi en Carora · Seguimiento GPS y Pago Móvil
      </p>
    </main>
  );
}
