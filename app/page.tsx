import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root path to dashboard. 
  // The middleware will automatically catch unauthenticated users and send them to /login
  redirect('/dashboard');
}
