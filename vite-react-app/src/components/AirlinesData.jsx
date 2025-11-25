import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";

const AIRLINE_MAP = { IBE:{name:"Iberia",color:"#E83323"},RYR:{name:"Ryanair",color:"#003882"},VLG:{name:"Vueling",color:"#FFCC00"},DLH:{name:"Lufthansa",color:"#001A5E"},AFR:{name:"Air France",color:"#00205B"},BAW:{name:"British Airways",color:"#00306E"},KLM:{name:"KLM",color:"#00A1E4"},EZY:{name:"easyJet",color:"#FF6600"},UAE:{name:"Emirates",color:"#D82C1F"},AAL:{name:"American Airlines",color:"#0078D2"},DAL:{name:"Delta",color:"#A8001F"},UAL:{name:"United",color:"#005DAA"},SWR:{name:"Swiss",color:"#E2051E"},QTR:{name:"Qatar Airways",color:"#5C0D32"},THY:{name:"Turkish Airlines",color:"#C00C0C"},DEFAULT:{name:prefix=>prefix,color:"#9CA3AF"}};
const MAX_MAP_POINTS=500;

function Globe3D({ positions=[] }){
  const sphereGeometry=useMemo(()=>new THREE.SphereGeometry(0.005,8,8),[]);
  const baseMaterial=useMemo(()=>new THREE.MeshBasicMaterial(),[]);
  const latLonToCartesian=(lat,lon,radius=1)=>{const phi=(90-lat)*(Math.PI/180);const theta=(lon+180)*(Math.PI/180);return[-radius*Math.sin(phi)*Math.cos(theta),radius*Math.cos(phi),radius*Math.sin(phi)*Math.sin(theta)];};
  return(<>
    <ambientLight intensity={0.7}/>
    <directionalLight position={[3,3,3]} intensity={1.1}/>
    <Sphere args={[1,32,32]}>
      <meshStandardMaterial color="#fff" roughness={1}/>
    </Sphere>
    {positions.slice(0,MAX_MAP_POINTS).map((p,i)=>{const [x,y,z]=latLonToCartesian(p.lat,p.lon,1.015);const mat=baseMaterial.clone();mat.color=new THREE.Color(p.color||AIRLINE_MAP.DEFAULT.color);return <mesh key={i} geometry={sphereGeometry} position={[x,y,z]} material={mat}/>;})}
  </>);
}

function ManualBarChart({ data }){if(!data?.length)return null;const max=Math.max(...data.map(a=>a.flights));return(<div className="w-full h-full flex items-end gap-2 px-4">{data.map((a,i)=>(<motion.div key={i} className="flex flex-col items-center flex-1 h-full relative group"><motion.div className="bg-black w-full" style={{borderRadius:4}} initial={{height:'0%'}} animate={{height:`${(a.flights/max)*100}%`}} transition={{duration:0.5,delay:i*0.04}}/><div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition bg-white/80 text-black text-xs p-1 rounded shadow z-10">{a.name}: {a.flights} vuelos</div><span className="text-[10px] mt-2 text-black text-center truncate w-full">{a.name}</span></motion.div>))}</div>);}

function ManualStackedBarChart({ data }){if(!data?.length)return null;const max=Math.max(...data.map(a=>a.flights));return(<div className="w-full h-full flex items-end gap-2 px-4">{data.map((a,i)=>{const cg=(a.onGround/max)*100;const ca=(a.inAir/max)*100;return(<div key={i} className="flex flex-col items-center flex-1 h-full relative group"><div className="flex flex-col w-full h-full"><motion.div className="bg-black" style={{borderRadius:4}} initial={{height:'0%'}} animate={{height:`${ca}%`}} transition={{duration:0.5,delay:i*0.04}}/><motion.div className="bg-neutral-400" style={{borderRadius:4}} initial={{height:'0%'}} animate={{height:`${cg}%`}} transition={{duration:0.5,delay:i*0.04}}/></div><div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition bg-white/80 text-black text-xs p-1 rounded shadow z-10">{a.name}: En aire {a.inAir}, En tierra {a.onGround}</div><span className="text-[10px] mt-2 text-black text-center truncate w-full">{a.name}</span></div>);})}</div>);}

function AltitudeChart({ data }){if(!data?.length)return null;const max=Math.max(...data.map(a=>a.avgAltitude));return(<div className="w-full h-full flex items-end gap-2 px-4">{data.map((a,i)=>(<motion.div key={i} className="flex flex-col items-center flex-1 h-full relative group"><motion.div className="bg-black w-full" style={{borderRadius:4}} initial={{height:'0%'}} animate={{height:`${(a.avgAltitude/max)*100}%`}} transition={{duration:0.5,delay:i*0.04}}/><div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition bg-white/80 text-black text-xs p-1 rounded shadow z-10">{a.name}: {a.avgAltitude.toLocaleString('es-ES')} m</div><span className="text-[10px] mt-2 text-black text-center truncate w-full">{a.name}</span></motion.div>))}</div>);}

function FlightPhaseChart({ data }){if(!data?.length)return null;return(<div className="w-full h-full flex items-end gap-2 px-4">{data.map((a,i)=>{const total=a.cruise+a.ascending+a.descending;const pc=(a.cruise/total)*100;const pa=(a.ascending/total)*100;const pd=(a.descending/total)*100;return(<div key={i} className="flex flex-col items-center flex-1 h-full relative group"><div className="flex flex-col w-full h-full"><motion.div className="bg-black" initial={{height:'0%'}} animate={{height:`${pc}%`}} transition={{duration:0.5,delay:i*0.04}}/><motion.div className="bg-neutral-600" initial={{height:'0%'}} animate={{height:`${pa}%`}} transition={{duration:0.5,delay:i*0.04}}/><motion.div className="bg-neutral-400" initial={{height:'0%'}} animate={{height:`${pd}%`}} transition={{duration:0.5,delay:i*0.04}}/></div><div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition bg-white/80 text-black text-xs p-1 rounded shadow z-10">{a.name}: Crucero {a.cruise}, Ascenso {a.ascending}, Descenso {a.descending}</div><span className="text-[10px] mt-2 text-black text-center truncate w-full">{a.name}</span></div>);})}</div>);}

export default function AirlinesDashboardMinimal(){
  const [airlines,setAirlines]=useState([]);const [positions,setPositions]=useState([]);const [stats,setStats]=useState({total:0,top:'—',topCount:0});const [loading,setLoading]=useState(true);const [lastUpdated,setLastUpdated]=useState(null);const [error,setError]=useState(null);
  const OPENSKY_USERNAME="an4s3crwt";const OPENSKY_PASSWORD="Mentaybolita1";

  const fetchData=useCallback(async()=>{setLoading(true);setError(null);try{const auth=btoa(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`);const res=await fetch("https://opensky-network.org/api/states/all",{headers:{"Authorization":`Basic ${auth}`}});if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();if(!data||!Array.isArray(data.states))throw new Error("Formato inesperado");const counts={};const positionsData=[];for(const f of data.states){if(!f)continue;const callsign=(f[1]||"").trim();const prefix=callsign.slice(0,3).toUpperCase();const onGround=!!f[8];if(prefix){if(!counts[prefix])counts[prefix]={total:0,onGround:0,inAir:0,altTotal:0,altCount:0,ascending:0,descending:0,cruise:0};counts[prefix].total++;if(onGround)counts[prefix].onGround++;else{counts[prefix].inAir++;const alt=f[7];const vr=f[11];if(alt!=null){counts[prefix].altTotal+=alt;counts[prefix].altCount++;}if(vr!=null){if(vr>1)counts[prefix].ascending++;else if(vr<-1)counts[prefix].descending++;else counts[prefix].cruise++;}else counts[prefix].cruise++;}}if(positionsData.length<MAX_MAP_POINTS && f[5]!=null && f[6]!=null && !onGround){const airlineInfo=AIRLINE_MAP[prefix]||AIRLINE_MAP.DEFAULT;positionsData.push({icao24:f[0],callsign:f[1]||"N/A",originCountry:f[2],lon:f[5],lat:f[6],velocity:Math.round((f[9]||0)*3.6),color:airlineInfo.color});}}
      const sorted=Object.entries(counts).sort((a,b)=>b[1].total-a[1].total);
      const mapped=sorted.slice(0,10).map(([prefix,d])=>{const info=AIRLINE_MAP[prefix]||AIRLINE_MAP.DEFAULT;return{name:typeof info.name==='function'?info.name(prefix):info.name,flights:d.total,onGround:d.onGround,inAir:d.inAir,avgAltitude:d.altCount>0?Math.round(d.altTotal/d.altCount):0,ascending:d.ascending,descending:d.descending,cruise:d.cruise};});
      setAirlines(mapped);setPositions(positionsData);setStats({total:Array.isArray(data.states)?data.states.length:0,top:mapped[0]?.name||'—',topCount:mapped[0]?.flights||0});setLastUpdated(new Date());}catch(err){setError(err?.message||String(err));}finally{setLoading(false);}},[]);

  useEffect(()=>{fetchData();const interval=setInterval(fetchData,300000);return()=>clearInterval(interval);},[fetchData]);

  return(<div className="min-h-screen bg-white text-black p-4 flex flex-col gap-4 max-w-7xl mx-auto">
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div><h1 className="text-3xl font-semibold">Tráfico Aéreo Global</h1><p className="text-sm text-neutral-600 mt-1">Minimal blanco y negro con tooltips y leyenda</p></div>
      <div className="flex items-center gap-3"><div className="text-sm text-neutral-600">Última: {lastUpdated?lastUpdated.toLocaleTimeString():'—'}</div><button onClick={fetchData} disabled={loading} className="border border-black px-3 py-2 rounded-md text-sm hover:bg-black hover:text-white transition disabled:opacity-50">{loading?'Actualizando...':'Actualizar'}</button></div>
    </header>
    {error && <div className="p-2 border border-red-300 rounded-md text-sm text-red-700">{error}</div>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 border rounded-xl">Vuelos activos<div className="text-2xl font-bold">{stats.total}</div></div>
      <div className="p-4 border rounded-xl">Aerolínea más activa<div className="text-2xl font-bold">{stats.top}</div></div>
      <div className="p-4 border rounded-xl">Vuelos de esa aerolínea<div className="text-2xl font-bold">{stats.topCount}</div></div>
    </div>
    {loading && !airlines.length?<div className="py-12 text-center text-neutral-500">Cargando...</div>:(<>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl h-[380px] flex flex-col"><h3 className="text-lg font-medium mb-2">Top 10 Aerolíneas (Total)</h3><ManualBarChart data={airlines}/></div>
        <div className="p-4 border rounded-xl h-[380px] flex flex-col"><h3 className="text-lg font-medium mb-2">Actividad de Flota (Top 10)</h3><ManualStackedBarChart data={airlines}/></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl h-[380px] flex flex-col"><h3 className="text-lg font-medium mb-2">Perfil de Vuelo (Altitud Media)</h3><AltitudeChart data={airlines}/></div>
        <div className="p-4 border rounded-xl h-[380px] flex flex-col"><h3 className="text-lg font-medium mb-2">Fases de Vuelo (Flota en Aire)</h3><FlightPhaseChart data={airlines}/></div>
      </div>
      <div className="p-4 border rounded-xl mt-4">
        <h3 className="text-lg font-medium mb-2">Mapa de Tráfico Aéreo (Vuelos en Aire)</h3>
        <div className="flex flex-wrap gap-3 text-xs text-neutral-700 mb-3">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-black"></div> Vuelo en aire</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-neutral-400"></div> Aerolínea desconocida</div>
        </div>
        <div className="h-[480px] w-full rounded-xl overflow-hidden"><Canvas camera={{position:[0,0,2.5],fov:75}}><Globe3D positions={positions}/><OrbitControls enableZoom={true} enablePan={false}/></Canvas></div>
      </div>
    </>)}</div>);
}
