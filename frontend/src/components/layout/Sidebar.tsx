"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useTransition } from "react";
import Image from "next/image";
import { useUsuario } from "@/hooks/useUsuario";
import { useNotifications } from "@/hooks/useNotifications";

import {
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Target,
  User,
  Wallet,
  Bell,
} from "lucide-react";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    mobileLabel: "Início",
    icon: LayoutDashboard,
  },
  {
    href: "/lista",
    label: "Lista de Compras",
    mobileLabel: "Compras",
    icon: ShoppingCart,
  },
  {
    href: "/avisos",
    mobileLabel: "Avisos",
    label: "Avisos",
    icon: Bell,
  },
  {
    href: "/financas",
    mobileLabel: "Finanças",
    label: "Finanças",
    icon: Wallet,
  },
  {
    href: "/planejamento",
    mobileLabel: "Planos",
    label: "Planejamento",
    icon: Target,
  },
  {
    href: "/perfil",
    mobileLabel: "Perfil",
    label: "Perfil",
    icon: User,
  },
  {
    href: "/configuracoes",
    mobileLabel: "Ajustes",
    label: "Configurações",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navegando, iniciarNavegacao] = useTransition();
  const { usuario } = useUsuario();
  const { naoLidos } = useNotifications(usuario?.id);

  function navegar(
    event: MouseEvent<HTMLAnchorElement>,
    destino: string
  ) {
    const novaAba =
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

    if (novaAba || destino === pathname) return;

    event.preventDefault();
    iniciarNavegacao(() => router.push(destino));
  }

  return (
    <>
      {navegando && (
        <div
          className="navigation-progress"
          role="progressbar"
          aria-label="Carregando página"
        />
      )}

      <aside className="fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] border-t border-border bg-card/95 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-72 md:flex-col md:border-r md:border-t-0">
      <div className="hidden h-20 items-center gap-3 border-b border-border px-6 md:flex">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 p-1.5 ring-1 ring-border">
          <Image src="/listaweb-logo.png" alt="Logo ListaWeb" width={36} height={36} priority className="size-9 object-contain dark:hidden" />
          <Image src="/listaweb-logo-dark.png" alt="" aria-hidden="true" width={36} height={36} priority className="hidden size-9 object-contain dark:block" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-foreground">
            ListaWeb
          </h1>

          <p className="text-xs text-muted-foreground">
            Organize suas compras
          </p>
        </div>
      </div>

      <nav className="grid w-full grid-cols-7 gap-1 p-2 md:block md:flex-1 md:space-y-2 md:p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const ativo = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => navegar(event, link.href)}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] transition md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm ${ativo
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
            >
              <span className="relative shrink-0"><Icon size={20} />{link.href === "/avisos" && naoLidos > 0 && <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">{Math.min(9, naoLidos)}</span>}</span>
              <span className="max-w-full truncate md:hidden">{link.mobileLabel}</span>
              <span className="hidden max-w-full truncate md:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
