import ThreeBackground from '../components/ThreeBackground';
import { useAuth } from '../context/AuthContext';
import './../index.css';
import './home.css';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container relative w-full h-screen overflow-hidden font-[Inter]">
      
      {/* Fondo 3D */}
      <ThreeBackground />

      {/* Imagen de fondo local simulando video */}
      <div className="home-image home-background absolute inset-0 w-full h-full z-0 pointer-events-none" />

      <div className="content relative z-10 text-gray-200 flex flex-col justify-center items-center text-center p-5 h-full pointer-events-auto">
  <div className="quote-container max-w-4xl">
    <div className="quote uppercase font-bold text-[8vw] mb-20">Flight Tracker</div>
    <div className="author italic opacity-70 mt-8 text-sm">It speaks before language</div>
    <div className="book opacity-50 mt-4 text-sm">x.com/flighty</div>
  </div>

  {/* Botón Live Map estilo Learn More */}
  <a href="/map">
    <button className="learn-more mt-8">
      <span className="circle" aria-hidden="true">
        <span className="icon arrow"></span>
      </span>
      <span className="button-text">Live Map</span>
    </button>
  </a>
</div>


</div>
  );
}

