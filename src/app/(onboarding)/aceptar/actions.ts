"use server";

import { redirect } from "next/navigation";
import { LEGAL_REQUIRED_MESSAGE } from "@/components/app/legal-check";
import { acceptLegal } from "@/lib/legal";
import { safeNext } from "@/lib/next-path";
import { getUser } from "@/lib/workspace";
import type { FormState } from "@/lib/validation/workspace";

export async function acceptTerms(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getUser())) redirect("/ingresar");

  if (formData.get("legal") !== "on") return { fieldErrors: { legal: LEGAL_REQUIRED_MESSAGE } };
  if (!(await acceptLegal())) {
    return { message: "No pudimos guardar tu aceptación. Probá de nuevo en un rato." };
  }

  redirect(safeNext(String(formData.get("next") ?? "")));
}
