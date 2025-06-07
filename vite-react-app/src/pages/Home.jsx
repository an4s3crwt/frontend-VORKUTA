import { useNavigate, Outlet } from 'react-router-dom';
import ThreeBackground from '../components/ThreeBackground';
import { useAuth } from '../context/AuthContext';
import './../index.css';
import './home.css'; //this is the problem
export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();


  return (
    <>
    
      {/* Caja blanca con fondo 3D dentro */}
      <div className="bg-white rounded-xl shadow-sm h-full w-full p-6 border relative overflow-hidden">



        <ThreeBackground />


        {/* Contenido por encima del fondo */}
        <div className="content relative z-10 text-gray-200 pointer-events-none flex flex-col justify-center items-center text-center p-5">
          <div className="quote-container max-w-4xl">
            <div className="quote uppercase font-bold text-[8vw] mb-20">Flight Tracker</div>
            <div className="author italic opacity-70 mt-8 text-sm">It speaks before language</div>
            <div className="book opacity-50 mt-4 text-sm">x.com/filipz</div>
          </div>
        </div>

        {/* Tarjeta del perfil */}
        <div className="profile-card absolute bottom-4 left-4 z-20 flex items-center gap-3 p-4 max-w-xs text-gray-200">
          <img
            className="w-7 h-7 rounded-full object-cover"
            src="https://filip-zrnzevic-portfolio-2025-v3.vercel.app/_next/image?url=%2Fimages%2Fprofile003.jpg&w=48&q=75"
            alt="Filip Zrnzević"
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Filip Zrnzević</p>
            <p className="text-xs text-gray-400">
              <a href="https://x.com/filipz" target="_blank" rel="noreferrer" className="hover:underline">
                @filipz
              </a>
            </p>
          </div>
        </div>

      </div>
    </>

  );
}