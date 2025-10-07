// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  // Home redirige siempre al login de staff
  redirect('/staff-login');
}
