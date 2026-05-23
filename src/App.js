import Musify from './Musify';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App(){ 
  return (
    <>
      <Musify />
      <SpeedInsights />
    </>
  );
}