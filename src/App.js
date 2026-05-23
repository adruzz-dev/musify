import { Analytics } from '@vercel/analytics/react';
import Musify from './Musify';

export default function App() {
  return (
    <>
      <Musify />
      <Analytics />
    </>
  );
}