import { startTransition, type FormEvent } from "react";

// Con `action={formAction}` React 19 reinicia el formulario tras cada respuesta del servidor: los
// campos controlados (materia, área, alumnos elegidos) quedan vacíos aunque el estado los conserve y
// los que tienen valor inicial vuelven a él, perdiendo lo que escribió la persona. Este envío manual
// no reinicia nada; `submitter` suma el botón apretado (el que lleva `name` y `value`).
export function submitKeepingForm(formAction: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  };
}
