"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Buscador del marketplace (§12.6). Patrón combobox: Flecha abajo y arriba recorren las
// sugerencias, Enter busca y Escape cierra. Al buscar va a /clases con los filtros en la URL.

export type Sugerencia = { texto: string; grupo: string };

type Variante = "home" | "compacto";

function resaltarCoincidencia(texto: string, termino: string) {
  const inicio = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .indexOf(termino);
  if (!termino || inicio < 0) return texto;
  return (
    <>
      {texto.slice(0, inicio)}
      <span className="font-semibold">{texto.slice(inicio, inicio + termino.length)}</span>
      {texto.slice(inicio + termino.length)}
    </>
  );
}

export function Buscador({
  variante = "home",
  sugerencias,
  zonas = [],
  valorInicial = "",
}: {
  variante?: Variante;
  sugerencias: Sugerencia[];
  zonas?: string[];
  valorInicial?: string;
}) {
  const router = useRouter();
  const id = useId();
  const lista = `${id}-lista`;
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(valorInicial);
  const [donde, setDonde] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);

  const termino = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  // Una materia que también es una búsqueda frecuente se muestra una sola vez, como materia.
  const unicas = [...new Map(sugerencias.map((item) => [item.texto, item])).values()];
  const visibles = unicas
    .filter((item) =>
      termino
        ? item.texto
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .includes(termino)
        : true,
    )
    .slice(0, 8);
  const mostrar = abierto && visibles.length > 0;

  function buscar(valor: string) {
    const params = new URLSearchParams();
    if (valor.trim()) params.set("q", valor.trim());
    const lugar = donde.trim();
    if (lugar.toLowerCase() === "online") params.set("modalidad", "online");
    else if (lugar) params.set("zona", lugar);
    const consulta = params.toString();
    setAbierto(false);
    router.push(consulta ? `/clases?${consulta}` : "/clases");
  }

  function alTeclear(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAbierto(true);
      setActiva((valor) => (valor + 1) % Math.max(visibles.length, 1));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActiva((valor) => (valor <= 0 ? visibles.length - 1 : valor - 1));
    } else if (evento.key === "Escape") {
      setAbierto(false);
      setActiva(-1);
    } else if (evento.key === "Enter" && mostrar && activa >= 0) {
      evento.preventDefault();
      setTexto(visibles[activa].texto);
      buscar(visibles[activa].texto);
    }
  }

  const home = variante === "home";

  return (
    <form
      role="search"
      aria-label="Buscar clases"
      onSubmit={(evento) => {
        evento.preventDefault();
        buscar(texto);
      }}
      className={cn("relative w-full", home && "max-w-3xl")}
    >
      <div
        className={cn(
          "border-border-input rounded-card focus-within:outline-ring flex items-center border bg-white focus-within:outline-2 focus-within:outline-offset-2",
          home ? "min-h-13 pr-1.5 sm:min-h-16 sm:pr-2" : "min-h-11 pr-1",
        )}
      >
        <label htmlFor={`${id}-q`} className="sr-only">
          ¿Qué querés aprender?
        </label>
        <Search
          className={cn("text-ink-3 ml-4 size-5 shrink-0", !home && "ml-3 size-4")}
          strokeWidth={1.8}
          aria-hidden
        />
        <input
          ref={campo}
          id={`${id}-q`}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={mostrar}
          aria-controls={lista}
          aria-autocomplete="list"
          aria-activedescendant={mostrar && activa >= 0 ? `${id}-op-${activa}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          value={texto}
          placeholder={home ? "¿Qué querés aprender?" : "Buscar clases"}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setAbierto(true);
            setActiva(-1);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          onKeyDown={alTeclear}
          className="placeholder:text-ink-3 text-ink h-full min-w-0 flex-1 bg-transparent px-3 text-base focus-visible:outline-none"
        />

        {home && (
          <>
            <span aria-hidden className="bg-line mx-1 hidden h-8 w-px sm:block" />
            <label htmlFor={`${id}-donde`} className="sr-only">
              ¿Dónde?
            </label>
            <div className="hidden min-w-0 items-center sm:flex sm:w-56">
              <MapPin className="text-ink-3 size-5 shrink-0" strokeWidth={1.8} aria-hidden />
              <input
                id={`${id}-donde`}
                name="donde"
                list={`${id}-zonas`}
                value={donde}
                onChange={(evento) => setDonde(evento.target.value)}
                placeholder="Online o barrio"
                autoComplete="off"
                className="placeholder:text-ink-3 text-ink h-full min-w-0 flex-1 bg-transparent px-3 text-base focus-visible:outline-none"
              />
              <datalist id={`${id}-zonas`}>
                <option value="Online" />
                {zonas.map((zona) => (
                  <option key={zona} value={zona} />
                ))}
              </datalist>
            </div>
          </>
        )}

        <Button type="submit" className={cn(!home && "hidden")}>
          Buscar
        </Button>
      </div>

      {mostrar && (
        <ul
          id={lista}
          role="listbox"
          aria-label="Sugerencias"
          className="border-line rounded-card absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto border bg-white p-2"
        >
          {visibles.map((item, indice) => (
            <li
              key={`${item.grupo}-${item.texto}`}
              id={`${id}-op-${indice}`}
              role="option"
              aria-selected={indice === activa}
              onMouseDown={(evento) => {
                evento.preventDefault();
                setTexto(item.texto);
                buscar(item.texto);
              }}
              className={cn(
                "rounded-control flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-base",
                indice === activa ? "bg-indigo-soft" : "hover:bg-paper",
              )}
            >
              <span className="truncate">{resaltarCoincidencia(item.texto, termino)}</span>
              <span className="text-ink-3 shrink-0 text-xs">{item.grupo}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
