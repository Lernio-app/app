import { Contenedor } from "@/components/expresivos/marco";
import { Resaltador } from "@/components/ui/resaltador";
import { LoginForm } from "@/app/(auth)/ingresar/login-form";

// Bloque "Sumarme" (§7, sección 9): índigo con cuadrícula y formulario blanco. Es el registro
// directo, sin lista de espera: el mismo ingreso de siempre, que vuelve al alta del espacio.
export function Sumarme({
  titulo = "Arrancá con tu primer alumno",
  resaltado = "esta semana.",
}: {
  titulo?: string;
  resaltado?: string;
}) {
  return (
    <section
      id="crear-cuenta"
      aria-labelledby="crear-cuenta-titulo"
      className="bg-cuadricula cuadricula-indigo on-indigo scroll-mt-20 text-white"
    >
      <Contenedor className="flex flex-wrap items-center gap-x-16 gap-y-10 py-[clamp(4.5rem,9vw,6rem)]">
        <div className="flex flex-[1_1_24rem] flex-col gap-5">
          <h2 id="crear-cuenta-titulo" className="title-h2 max-w-[14ch]">
            {titulo} <Resaltador variant="bloque">{resaltado}</Resaltador>
          </h2>
          <p className="text-indigo-muted-2 lead max-w-[34rem]">
            Creá tu cuenta, cargá a un alumno y mandale la primera tarea. Con 1 alumno es gratis.
          </p>
        </div>
        <div className="text-ink rounded-card flex flex-[1_1_22rem] flex-col gap-5 bg-white p-6 sm:p-7">
          <div className="space-y-1">
            <p className="text-lg font-semibold">Crear mi cuenta de profe</p>
            <p className="text-ink-3 text-sm">
              Te mandamos un link para entrar. Sin contraseña y sin tarjeta.
            </p>
          </div>
          <LoginForm
            initialError={null}
            googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"}
            next="/bienvenida"
          />
        </div>
      </Contenedor>
    </section>
  );
}
