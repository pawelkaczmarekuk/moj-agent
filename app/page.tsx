import { authenticated, configured } from './lib/auth';
import Gate from './gate';

export default async function Home() {
  return <Gate initialAuthenticated={await authenticated()} configured={configured()} />;
}
