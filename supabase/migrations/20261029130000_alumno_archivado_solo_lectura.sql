-- Alumno archivado, en solo lectura (`producto` #13, ADR-0003).
-- Si el profe archiva al alumno, la cuenta vinculada sigue viendo el espacio: su historial de clases
-- con asistencia, sus cargos y pagos y, si debe algo, cuánto y cómo pagar. Ya lo permiten las
-- políticas de cobros y de `my_student_links()`, que no miran `archived_at`. Lo que cambia es que
-- no vea próximas clases: la política de `lessons` solo deja las que ya terminaron. Al restaurar al
-- alumno vuelve a ver todo.

drop policy lessons_select_linked on public.lessons;

create policy lessons_select_linked on public.lessons
  for select to authenticated
  using (
    exists (
      select 1
      from public.lesson_attendees a
      join public.students s on s.id = a.student_id
      where a.lesson_id = lessons.id
        and s.user_id = (select auth.uid())
        and (s.archived_at is null or lessons.ends_at < now())
    )
  );
