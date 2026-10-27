import {
  CalendarClock,
  Check,
  FileText,
  ImageIcon,
  Link2,
  MessageCircle,
  Mic,
  Play,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { AreaSwatch, AreaTag, TeacherAvatar, type Area } from "@/components/ui/area";
import { StatusChip } from "@/components/ui/status-chip";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

// Capturas del producto para el sitio (§1, "El marketing muestra pantallas reales"). Son
// recreaciones de pantallas de la app con las mismas primitivas y la superficie anidada, con datos
// de ejemplo. En apoyo escolar no llevan nombres ni notas de alumnos (§10).

const SOLIDO: Record<Exclude<Area, "otra">, string> = {
  idiomas: "bg-subj-lang",
  ingreso: "bg-subj-uni",
  apoyo: "bg-subj-school",
  musica: "bg-subj-music",
};
const TINTE: Record<Exclude<Area, "otra">, string> = {
  idiomas: "bg-subj-lang-bg",
  ingreso: "bg-subj-uni-bg",
  apoyo: "bg-subj-school-bg",
  musica: "bg-subj-music-bg",
};
const BORDE: Record<Exclude<Area, "otra">, string> = {
  idiomas: "border-subj-lang",
  ingreso: "border-subj-uni",
  apoyo: "border-subj-school",
  musica: "border-subj-music",
};

// Marco de una pantalla de la app: borde, encabezado con título en Bricolage y dato a la derecha.
export function Pantalla({
  titulo,
  dato,
  className,
  children,
}: {
  titulo: string;
  dato?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Surface name="app" className={cn("min-h-0 flex-none", className)}>
      <div className="rounded-card border-border-control overflow-hidden border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-4 py-3 sm:px-5">
          <span className="title-section text-ink text-[1.125rem]">{titulo}</span>
          {dato && <span className="num text-ink-3 text-[13px]">{dato}</span>}
        </div>
        {children}
      </div>
    </Surface>
  );
}

function Fila({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "border-line-soft flex items-center gap-3 border-b px-4 py-3 text-[15px] last:border-b-0 sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Quien({
  area,
  nombre,
  detalle,
  detalleDesdeSm = false,
}: {
  area: Area;
  nombre: string;
  detalle: string;
  // En filas con estado y monto, la materia se ve recién desde sm para no cortar el nombre.
  detalleDesdeSm?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2.5">
      <AreaSwatch area={area} />
      <span className="min-w-0 truncate">
        <span className="font-semibold">{nombre}</span>{" "}
        <span className={cn("text-ink-3", detalleDesdeSm && "hidden sm:inline")}>{detalle}</span>
      </span>
    </span>
  );
}

function Formato({ icon: Icon, children }: { icon: typeof Mic; children: React.ReactNode }) {
  return (
    <span className="bg-paper text-ink-2 inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2 py-1 text-xs font-semibold">
      <Icon className="size-3.5" strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

// Borrador de la IA (§6, "Sugerencia de la IA"): borde punteado, siempre "te propone".
function Borrador({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="bg-ai-bg border-ai-border rounded-[12px] border-[1.5px] border-dashed px-3.5 py-3">
      <p className="label-mono text-indigo-strong">{etiqueta}</p>
      <p className="text-ink mt-1.5 text-[14px] leading-relaxed">{children}</p>
    </div>
  );
}

function BotonFalso({ oscuro, children }: { oscuro?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3.5 text-sm font-semibold",
        oscuro ? "bg-ink text-white" : "border-border-control text-ink border bg-white",
      )}
    >
      {children}
    </span>
  );
}

// Casilleros (§5.5): uno por clase o tarea; lleno en el sólido del área, vacío con borde.
export function Casilleros({
  area,
  llenos,
  total,
  etiqueta,
}: {
  area: Exclude<Area, "otra">;
  llenos: number;
  total: number;
  etiqueta: string;
}) {
  return (
    <span role="img" aria-label={etiqueta} className="flex gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 flex-1 rounded-[3px]",
            i < llenos ? SOLIDO[area] : cn("border bg-white", BORDE[area]),
          )}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Sitio para profes

// Hero: lo que llegó para corregir, con la devolución abierta.
export function CapturaParaCorregir() {
  return (
    <Pantalla titulo="Para corregir" dato="6 entregas · viernes 23/10">
      <div className="flex flex-wrap">
        <div className="min-w-0 flex-[999_1_28rem] border-b md:border-r md:border-b-0">
          <Fila className="bg-indigo-next">
            <Quien area="idiomas" nombre="Lucía M." detalle="Inglés · Writing del First" />
            <Formato icon={FileText}>PDF</Formato>
          </Fila>
          <Fila>
            <Quien area="ingreso" nombre="Nicolás R." detalle="Análisis · simulacro parcial 1" />
            <span className="num text-ink-2 shrink-0 text-sm">7 de 10</span>
          </Fila>
          <Fila>
            <Quien area="musica" nombre="Martín G." detalle="Guitarra · escala de Re mayor" />
            <Formato icon={Mic}>0:58</Formato>
          </Fila>
          <Fila>
            <Quien area="apoyo" nombre="Alumno de 2.º año" detalle="Lengua · sintaxis" />
            <Formato icon={ImageIcon}>Foto</Formato>
          </Fila>
          <Fila>
            <Quien area="idiomas" nombre="Joaquín P." detalle="Portugués · verbos irregulares" />
            <span className="num text-ink-2 shrink-0 text-sm">9 de 10</span>
          </Fila>
          <Fila>
            <Quien area="ingreso" nombre="Grupo ingreso" detalle="Química · simulacro 2" />
            <span className="num text-ink-2 shrink-0 text-sm">3 de 4 rindieron</span>
          </Fila>
        </div>
        <div className="bg-cuadricula flex flex-[1_1_18rem] flex-col gap-3 p-4 [--grid-size:20px] sm:p-5">
          <p className="label-mono text-ink-3">Devolución · Lucía M.</p>
          <div className="rounded-control border bg-white px-3.5 py-3 text-[14px] leading-relaxed">
            <span className="text-ink-3">Consigna:</span> Opinion essay, 140–190 palabras. «Should
            homework be banned?»
          </div>
          <Borrador etiqueta="Sugerencia · borrador">
            Buena estructura y opinión clara. Revisá los conectores del segundo párrafo: «however»
            aparece tres veces.
          </Borrador>
          <div className="flex flex-wrap items-center gap-2">
            <span className="num rounded-control border-border-input flex h-10 items-center border bg-white px-3 text-[15px]">
              8
            </span>
            <BotonFalso oscuro>Devolver con nota</BotonFalso>
          </div>
        </div>
      </div>
    </Pantalla>
  );
}

// Lo que llegaba antes: la foto por WhatsApp. Decorativa, acompaña al hero.
export function FotoDelChat({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "border-border-control rounded-[14px_14px_14px_4px] border bg-white p-2.5 select-none",
        className,
      )}
    >
      <p className="text-ink mb-2 px-1 pt-0.5 text-[13px] leading-snug">
        te mando la tarea, la 2 no se ve bien
      </p>
      <div className="bg-paper relative flex h-20 items-center justify-center overflow-hidden rounded-[10px]">
        <span className="bg-line absolute top-5 -left-4 h-px w-[140%] rotate-[8deg]" />
        <span className="bg-line absolute top-11 -left-4 h-px w-[140%] rotate-[8deg]" />
        <span className="bg-line absolute top-17 -left-4 h-px w-[140%] rotate-[8deg]" />
        <ImageIcon className="text-ink-3 size-7" strokeWidth={1.6} />
      </div>
      <p className="num text-ink-3 mt-1 px-1 text-right text-[11px]">23:47</p>
    </div>
  );
}

export function CapturaCobros() {
  const filas = [
    ["idiomas", "Lucía M.", "Inglés", "debt", "Debe 2 clases", "$ 36.000"],
    ["ingreso", "Camila D.", "Física", "debt", "Debe el paquete", "$ 54.000"],
    ["ingreso", "Mora T.", "Química", "debt", "Debe 1 clase", "$ 18.000"],
    ["musica", "Martín G.", "Guitarra", "ok", "Al día", "$ 0"],
    ["idiomas", "Joaquín P.", "Portugués", "ok", "Al día", "$ 0"],
    ["musica", "Valentina S.", "Piano", "ok", "Al día", "$ 0"],
  ] as const;
  return (
    <Pantalla titulo="Para cobrar" dato="$ 108.000 · semana del 19/10">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:px-5">
        <span role="img" aria-label="3 al día y 3 deben" className="flex gap-[3px]">
          <span className="bg-ok-solid h-3 flex-1 rounded-[4px]" />
          <span className="bg-debt-solid h-3 flex-1 rounded-[4px]" />
        </span>
        <span className="text-ink-3 text-[13px]">3 al día · 3 deben</span>
      </div>
      {filas.map(([area, nombre, materia, estado, texto, monto]) => (
        <Fila key={nombre}>
          <Quien area={area} nombre={nombre} detalle={materia} detalleDesdeSm />
          <StatusChip status={estado}>{texto}</StatusChip>
          <span className={cn("num w-20 shrink-0 text-right", estado === "ok" && "text-ink-3")}>
            {monto}
          </span>
        </Fila>
      ))}
    </Pantalla>
  );
}

// Texto listo para mandar desde el WhatsApp del profe.
export function TextoListo({ children, accion }: { children: React.ReactNode; accion: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="label-mono text-indigo-strong">Texto listo para mandar</p>
      <p className="border-line rounded-[14px_14px_14px_4px] border bg-white px-4 py-3 text-[15px] leading-relaxed">
        {children}
      </p>
      <div className="flex flex-wrap gap-2">
        <BotonFalso oscuro>
          <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
          {accion}
        </BotonFalso>
        <BotonFalso>Editar</BotonFalso>
      </div>
    </div>
  );
}

export function CapturaTareas() {
  return (
    <div className="flex flex-col gap-2">
      {(
        [
          ["Tarea de Lengua", ImageIcon, "Foto"],
          ["Práctica de escalas", Mic, "Audio"],
          ["Opinion essay", FileText, "PDF"],
        ] as const
      ).map(([titulo, icono, formato]) => (
        <div
          key={titulo}
          className="flex items-center justify-between gap-2 rounded-[12px] bg-white px-3.5 py-2.5 text-[14px]"
        >
          <span className="font-medium">{titulo}</span>
          <Formato icon={icono}>{formato}</Formato>
        </div>
      ))}
    </div>
  );
}

export function CapturaSimulacro() {
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-subj-uni-ink text-[13px] font-semibold">Simulacro · Análisis I</span>
        <span className="num text-ink inline-flex items-center gap-1 text-[15px]">
          <Timer className="size-4" strokeWidth={2} aria-hidden />
          45:00
        </span>
      </div>
      <p className="num bg-paper rounded-[10px] px-3 py-2.5 text-[15px]">
        Derivá f(x) = x² · ln(x)
      </p>
      <Borrador etiqueta="La IA te propone 5 preguntas">Elegís cuáles van y las editás.</Borrador>
    </div>
  );
}

export function CapturaPortal() {
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-white p-4">
      <div className="flex items-center gap-2.5">
        <TeacherAvatar area="idiomas" name="Ana Ferreyra" size={32} />
        <span className="min-w-0 text-[14px] leading-tight">
          <span className="block font-semibold">Ana Ferreyra</span>
          <span className="text-ink-3">Inglés · B2</span>
        </span>
      </div>
      <div className="bg-paper flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[14px]">
        <span>Próxima clase</span>
        <span className="num">Mar 03/11 · 18:30</span>
      </div>
      <div className="bg-paper flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[14px]">
        <span>Opinion essay</span>
        <StatusChip status="pending">Vence el jueves</StatusChip>
      </div>
    </div>
  );
}

export function CapturaReporte({ area = "ingreso" }: { area?: Exclude<Area, "otra"> }) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-white p-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold">Asistencia</span>
          <span className="num">7 de 8</span>
        </div>
        <Casilleros area={area} llenos={7} total={8} etiqueta="7 clases presentes de 8" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold">Tareas entregadas</span>
          <span className="num">5 de 6</span>
        </div>
        <Casilleros area={area} llenos={5} total={6} etiqueta="5 tareas entregadas de 6" />
      </div>
      <p className="label-mono text-indigo-strong border-ai-border bg-ai-bg w-fit rounded-[8px] border-[1.5px] border-dashed px-2.5 py-1">
        Comentario · borrador para revisar
      </p>
    </div>
  );
}

// Vista previa de una clase publicada, con la superficie del marketplace (§12.7).
export function CapturaPublicacion() {
  const dias = ["L", "M", "M", "J", "V", "S", "D"];
  const conHorario = [1, 3];
  return (
    <Surface name="marketplace" className="min-h-0 flex-none">
      <div className="rounded-card border-line flex flex-col gap-4 border bg-white p-5">
        <AreaTag area="idiomas">Inglés · B2</AreaTag>
        <p className="title-card text-ink">Preparación First</p>
        <div className="flex items-center gap-2.5">
          <TeacherAvatar area="idiomas" name="Ana Ferreyra" size={32} />
          <span className="text-[14px] leading-tight">
            <span className="block font-semibold">Ana Ferreyra</span>
            <span className="text-ink-3 text-[13px]">Profe de inglés</span>
          </span>
        </div>
        <p className="text-ink-2 text-[14px]">Online · Presencial en Palermo · Individual</p>
        <div className="flex flex-col gap-1.5">
          <span
            role="img"
            aria-label="Tiene horarios martes y jueves a la tarde"
            className="flex gap-1"
          >
            {dias.map((dia, i) => (
              <span
                key={i}
                className={cn(
                  "flex size-[18px] items-center justify-center rounded-[4px] text-[10px] font-semibold",
                  conHorario.includes(i) ? "bg-subj-lang text-white" : "bg-paper text-ink-3",
                )}
              >
                {dia}
              </span>
            ))}
          </span>
          <span className="text-ink-3 text-[13px]">Martes y jueves a la tarde</span>
        </div>
        <div className="border-line-soft flex items-baseline justify-between border-t pt-3">
          <span>
            <span className="num text-ink text-lg">$ 18.000</span>{" "}
            <span className="text-ink-3 text-[13px]">por clase</span>
          </span>
          <span className="text-ink-3 text-[13px]">Consultar</span>
        </div>
      </div>
    </Surface>
  );
}

// La consulta que llega a la app: el profe ve el nombre, no el contacto.
export function CapturaConsulta() {
  return (
    <Pantalla titulo="Mensajes" dato="1 consulta nueva">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[14px]">
          <span className="font-semibold">Sofía L.</span>
          <span className="text-ink-3">· Preparación First</span>
        </div>
        <p className="bg-paper w-fit max-w-[22rem] rounded-[14px_14px_14px_4px] px-4 py-3 text-[14px] leading-relaxed">
          Hola, rindo el First en diciembre y quiero practicar Writing. ¿Tenés lugar los jueves?
        </p>
        <div className="flex flex-wrap gap-2">
          <BotonFalso oscuro>Responder</BotonFalso>
          <BotonFalso>Sumar como alumna</BotonFalso>
        </div>
      </div>
    </Pantalla>
  );
}

// ---------------------------------------------------------------------------------------------
// Páginas por área: una mini interfaz por caso de uso.

function Tarjeta({
  area,
  className,
  children,
}: {
  area: Exclude<Area, "otra">;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Surface name="app" className="min-h-0 flex-none">
      <div className={cn("rounded-card flex flex-col gap-2.5 p-4 sm:p-5", TINTE[area], className)}>
        {children}
      </div>
    </Surface>
  );
}

function Blanca({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[12px] bg-white px-3.5 py-3 text-[14px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Audio({ area, duracion }: { area: Exclude<Area, "otra">; duracion: string }) {
  const barras = [3, 6, 9, 5, 11, 8, 4, 10, 7, 12, 6, 9, 5, 8, 3, 7, 10, 6, 4, 8];
  return (
    <Blanca>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-white",
          SOLIDO[area],
        )}
      >
        <Play className="size-3.5 fill-current" strokeWidth={2} aria-hidden />
      </span>
      <span aria-hidden className="flex h-6 flex-1 items-center gap-[3px]">
        {barras.map((alto, i) => (
          <span
            key={i}
            style={{ height: alto * 2 }}
            className={cn("w-[3px] rounded-full", i < 7 ? SOLIDO[area] : "bg-border-control")}
          />
        ))}
      </span>
      <span className="num text-ink-2 text-[13px]">{duracion}</span>
    </Blanca>
  );
}

function Opcion({ correcta, children }: { correcta?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[14px]",
        correcta ? "border-ok bg-white" : "border-line bg-white",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          correcta ? "border-ok bg-ok text-white" : "border-border-input",
        )}
      >
        {correcta && <Check className="size-3" strokeWidth={3} aria-hidden />}
      </span>
      {children}
    </span>
  );
}

export function CapturaArea({ captura, area }: { captura: string; area: Exclude<Area, "otra"> }) {
  switch (captura) {
    case "simulacro-first":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">First · Reading and Use of English</span>
            <span className="num inline-flex items-center gap-1">
              <Timer className="size-4" strokeWidth={2} aria-hidden />
              75:00
            </span>
          </Blanca>
          <div className="flex flex-col gap-2 rounded-[12px] bg-white p-3.5">
            <p className="label-mono text-ink-3">Part 1 · pregunta 3 de 8</p>
            <p className="text-[14px]">She ___ the report before the meeting started.</p>
            <Opcion>has finished</Opcion>
            <Opcion correcta>had finished</Opcion>
          </div>
        </Tarjeta>
      );
    case "speaking-audio":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Speaking · Part 2</span>
            <StatusChip status="ok">Entregada</StatusChip>
          </Blanca>
          <Audio area={area} duracion="1:42" />
          <Blanca>
            <span className="text-ink-3">Devolución:</span> Muy buena fluidez. Ojo con «I am agree».
          </Blanca>
        </Tarjeta>
      );
    case "niveles-idiomas":
      return (
        <Tarjeta area={area}>
          {(
            [
              ["Lucía M.", "Inglés · B2"],
              ["Joaquín P.", "Portugués · A2"],
              ["Grupo conversación", "Inglés · C1 · 5 alumnos"],
            ] as const
          ).map(([nombre, detalle]) => (
            <Blanca key={nombre} className="justify-between">
              <span className="font-semibold">{nombre}</span>
              <span className="text-subj-lang-ink text-[13px] font-semibold">{detalle}</span>
            </Blanca>
          ))}
        </Tarjeta>
      );
    case "simulacro-formulas":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Simulacro · Análisis I</span>
            <span className="num inline-flex items-center gap-1">
              <Timer className="size-4" strokeWidth={2} aria-hidden />
              90:00
            </span>
          </Blanca>
          <div className="flex flex-col gap-2 rounded-[12px] bg-white p-3.5">
            <p className="label-mono text-ink-3">Pregunta 4 · respuesta numérica</p>
            <p className="num text-[17px]">∫₀¹ (3x² + 2x) dx = ?</p>
            <span className="num rounded-control border-border-input w-24 border px-3 py-2 text-[15px]">
              2
            </span>
          </div>
        </Tarjeta>
      );
    case "ejercicio-foto":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Práctica de límites</span>
            <Formato icon={ImageIcon}>3 fotos</Formato>
          </Blanca>
          <div className="grid grid-cols-3 gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="flex h-20 flex-col justify-center gap-2 rounded-[10px] bg-white px-2"
              >
                <span className="bg-line h-px" />
                <span className="bg-line h-px w-3/4" />
                <span className="bg-line h-px" />
                <span className="bg-line h-px w-1/2" />
              </span>
            ))}
          </div>
          <Blanca className="justify-between">
            <span>Nota</span>
            <span className="num font-medium">9</span>
          </Blanca>
        </Tarjeta>
      );
    case "grupo-ingreso":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Grupo ingreso · Química</span>
            <span className="num text-ink-2">Sáb · 10:00</span>
          </Blanca>
          {(
            [
              ["Valentina S.", "ok", "Presente"],
              ["Bruno A.", "ok", "Presente"],
              ["Mora T.", "debt", "Faltó sin avisar"],
              ["Iván C.", "ok", "Presente"],
            ] as const
          ).map(([nombre, estado, texto]) => (
            <Blanca key={nombre} className="justify-between py-2.5">
              <span>{nombre}</span>
              <StatusChip status={estado} cross={estado === "debt"}>
                {texto}
              </StatusChip>
            </Blanca>
          ))}
        </Tarjeta>
      );
    case "tarea-lengua":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Análisis sintáctico · 2.º año</span>
            <span className="text-ink-3 text-[13px]">Vence el jueves</span>
          </Blanca>
          <Blanca>
            <Link2 className="text-subj-school-ink size-4" strokeWidth={2} aria-hidden />
            <span className="flex-1">oraciones-unidad-3.pdf</span>
          </Blanca>
          <Blanca className="justify-between">
            <span>Entrega</span>
            <span className="flex items-center gap-2">
              <Formato icon={ImageIcon}>2 fotos</Formato>
              <StatusChip status="ok">Entregada</StatusChip>
            </span>
          </Blanca>
        </Tarjeta>
      );
    case "reporte-familia":
      return (
        <Tarjeta area={area}>
          <p className="title-section text-ink">Reporte de octubre</p>
          <CapturaReporte area={area} />
        </Tarjeta>
      );
    case "consentimiento":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Cuenta del alumno</span>
            <StatusChip status="pending">Esperando consentimiento</StatusChip>
          </Blanca>
          <Blanca>
            <ShieldCheck
              className="text-subj-school-ink size-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            <span>El pedido le llega al adulto responsable por un link, sin cuenta.</span>
          </Blanca>
          <Blanca className="justify-between">
            <span>Avisos y reporte</span>
            <span className="text-ink-3 text-[13px]">A la familia</span>
          </Blanca>
        </Tarjeta>
      );
    case "escalas-audio":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="font-semibold">Escala de Re mayor, dos octavas</span>
            <StatusChip status="ok">Entregada</StatusChip>
          </Blanca>
          <Audio area={area} duracion="0:58" />
          <Blanca>
            <span className="text-ink-3">Devolución:</span> Bien el pulso. La subida, más lenta.
          </Blanca>
        </Tarjeta>
      );
    case "lenguaje-musical":
      return (
        <Tarjeta area={area}>
          <div className="flex flex-col gap-2 rounded-[12px] bg-white p-3.5">
            <p className="label-mono text-ink-3">Intervalos · pregunta 2 de 6</p>
            <p className="text-[14px]">¿Qué intervalo hay entre Do y Mi?</p>
            <Opcion>Segunda mayor</Opcion>
            <Opcion correcta>Tercera mayor</Opcion>
            <Opcion>Cuarta justa</Opcion>
          </div>
        </Tarjeta>
      );
    case "horario-fijo":
      return (
        <Tarjeta area={area}>
          <Blanca className="justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <CalendarClock className="size-4" strokeWidth={2} aria-hidden />
              Martes · 18:30
            </span>
            <span className="text-ink-3 text-[13px]">Todas las semanas</span>
          </Blanca>
          {(
            [
              ["Mar 03/11", "next", "Próxima"],
              ["Mar 10/11", "pending", "Programada"],
              ["Mar 17/11", "pending", "Programada"],
            ] as const
          ).map(([fecha, estado, texto]) => (
            <Blanca key={fecha} className="justify-between py-2.5">
              <span className="num">{fecha}</span>
              <StatusChip status={estado}>{texto}</StatusChip>
            </Blanca>
          ))}
        </Tarjeta>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------------------------
// La IA (plan pago): siempre un borrador con borde punteado, que el profe revisa (§6, §9).

function Casilla({ marcada }: { marcada?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
        marcada ? "border-indigo bg-indigo text-white" : "border-border-input bg-white",
      )}
    >
      {marcada && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

export function CapturaIA({ tipo }: { tipo: "preguntas" | "correccion" | "reporte" }) {
  if (tipo === "preguntas") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="border-border-input rounded-[10px] border bg-white px-3.5 py-2.5 text-[14px]">
          <span className="text-ink-3">Tema:</span> derivadas, regla del producto
        </div>
        <div className="bg-ai-bg border-ai-border flex flex-col gap-2 rounded-[12px] border-[1.5px] border-dashed p-3">
          <p className="label-mono text-indigo-strong">Te propone 10 preguntas · borrador</p>
          {(
            [
              ["Derivá f(x) = x² · ln(x)", true],
              ["Derivá g(x) = eˣ · sen(x)", true],
              ["¿Cuánto vale h′(1) si h(x) = x³ · eˣ?", false],
            ] as const
          ).map(([pregunta, marcada]) => (
            <span
              key={pregunta}
              className="flex items-center gap-2.5 rounded-[8px] bg-white px-3 py-2 text-[14px]"
            >
              <Casilla marcada={marcada} />
              <span className="num">{pregunta}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (tipo === "correccion") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="rounded-[10px] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed">
          <span className="text-ink-3">Respuesta:</span> «The city is more crowded that it was ten
          years ago, and the transport are worse.»
        </div>
        <div className="bg-ai-bg border-ai-border rounded-[12px] border-[1.5px] border-dashed px-3.5 py-3">
          <p className="label-mono text-indigo-strong">Sugerencia · borrador</p>
          <p className="mt-1.5 text-[14px] leading-relaxed">
            Dos errores: «than», no «that»; y «transport is», en singular. Buena idea de
            comparación.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="num border-border-input flex h-9 items-center rounded-[10px] border bg-white px-3 text-[14px]">
            Nota: vos
          </span>
          <span className="text-ink-3 text-[13px]">Aceptar, editar o descartar</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5 rounded-[10px] bg-white px-3.5 py-3">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold">Tareas entregadas</span>
          <span className="num">5 de 6</span>
        </div>
        <Casilleros area="idiomas" llenos={5} total={6} etiqueta="5 tareas entregadas de 6" />
      </div>
      <div className="bg-ai-bg border-ai-border rounded-[12px] border-[1.5px] border-dashed px-3.5 py-3">
        <p className="label-mono text-indigo-strong">Comentario del mes · borrador</p>
        <p className="mt-1.5 text-[14px] leading-relaxed">
          Lucía entregó casi todas las tareas y mejoró mucho en Writing. En noviembre vamos a
          practicar Listening con tiempo.
        </p>
      </div>
    </div>
  );
}
