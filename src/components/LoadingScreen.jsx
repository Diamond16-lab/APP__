import { BrandMark } from './BrandMark';

export function LoadingScreen({ text = 'Cargando proyecto...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <BrandMark />
        <div className="loading-orb" />
        <p className="loading-text">{text}</p>
      </div>
    </div>
  );
}
