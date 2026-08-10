"use client";

import { Info, MoonStar, Palette, Sun, Tags } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import { Switch } from "@/components/ui/switch";
import { useUsuario } from "@/hooks/useUsuario";
import { useTheme } from "@/providers/ThemeProvider";
import CategoryManagerModal from "@/components/configuracoes/CategoryManagerModal";

export default function ConfiguracoesPage() {
  const { temaEscuro, alterarTema } = useTheme();
  const { usuario } = useUsuario();
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);

  return (
    <AppLayout
      titulo="Configurações"
      subtitulo="Personalize sua experiência no ListaWeb."
      nome={usuario?.nome ?? "Usuário"}
    >
      <section className="surface overflow-hidden">
        <header className="border-b border-border bg-gradient-to-r from-primary/10 to-transparent p-6 sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Palette size={23} />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Aparência</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Escolha o tema mais confortável. Sua preferência fica salva neste dispositivo.
          </p>
        </header>

        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between gap-5 rounded-2xl border border-border p-5 transition hover:bg-muted/30">
            <div className="flex items-center gap-4">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${temaEscuro ? "bg-violet-500/10 text-violet-600" : "bg-amber-500/10 text-amber-600"}`}>
                {temaEscuro ? <MoonStar size={21} /> : <Sun size={21} />}
              </span>
              <div>
                <p className="font-medium">Tema escuro</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {temaEscuro ? "O modo escuro está ativado." : "O modo claro está ativado."}
                </p>
              </div>
            </div>
            <Switch checked={temaEscuro} onCheckedChange={alterarTema} />
          </div>
        </div>
      </section>
      <section className="surface mt-6 p-5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><Tags size={21} /></span><div><h2 className="text-xl font-semibold">Categorias</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Crie e organize as categorias disponíveis em todo o ListaWeb.</p></div></div><button type="button" onClick={() => setCategoriasAbertas(true)} className="button-primary">Gerenciar categorias</button></div>
      </section>
      <CategoryManagerModal aberto={categoriasAbertas} onFechar={() => setCategoriasAbertas(false)} />
      <section className="surface mt-6 p-5 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><Info size={21} /></span><div><h2 className="text-xl font-semibold">Sobre o ListaWeb</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Conheça o propósito, as fases e quem está construindo o projeto.</p></div></div><Link href="/sobre" className="button-secondary">Conhecer o projeto</Link></div></section>
    </AppLayout>
  );
}
