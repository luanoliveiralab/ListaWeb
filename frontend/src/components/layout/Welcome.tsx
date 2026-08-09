import { UserRound } from "lucide-react";
import Image from "next/image";

interface WelcomeProps {
  nome: string;
  foto?: string | null;
}

export default function Welcome({ nome, foto }: WelcomeProps) {
  const hora = new Date().getHours();

  let saudacao = "Boa noite";

  if (hora < 12) {
    saudacao = "Bom dia";
  } else if (hora < 18) {
    saudacao = "Boa tarde";
  }

  return (
    <section className="surface relative mb-6 overflow-hidden bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-primary">
            {saudacao}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {nome}
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Bem-vindo ao seu painel. Organize suas compras,
            acompanhe seu progresso e mantenha tudo sob
            controle em um só lugar.
          </p>
        </div>

        <div className="hidden shrink-0 lg:block">
          {foto ? (
            <Image
              src={foto}
              alt={`Foto de ${nome}`}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-2xl border-4 border-background object-cover shadow-lg"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <UserRound className="h-9 w-9" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
