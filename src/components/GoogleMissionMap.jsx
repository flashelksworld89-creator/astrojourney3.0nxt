import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMaps';

const toRad=d=>d*Math.PI/180;
function distanceMeters(a,b){
  if(!a||!b)return 0;
  const R=6371008.8;
  const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng);
  const p1=toRad(a.lat),p2=toRad(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

export default function GoogleMissionMap({
  location,
  analysisLocation,
  destination,
  fullscreen,
  radiusMeters=152.4,
  followUser=true,
  cityCentered=false,
  cityCenter=null,
  cityRadiusMeters=null,
  onCityCenterChange,
  onStreetViewChange,
  onStreetPovChange,
  onCityViewportChange
}) {
  const el=useRef(null),mapRef=useRef(null),mapsRef=useRef(null),userMarkerRef=useRef(null),analysisMarkerRef=useRef(null),destMarkerRef=useRef(null),routeRef=useRef(null),scaleCircleRef=useRef(null),cityMarkerRef=useRef(null),initialized=useRef(false),panoramaRef=useRef(null),resolvedCityKey=useRef('');
  const [error,setError]=useState('');

  const effectiveCenter=cityCentered&&cityCenter?cityCenter:location;
  const effectiveRadius=cityCentered&&Number.isFinite(Number(cityRadiusMeters))?Number(cityRadiusMeters):radiusMeters;


  const publishCityViewport=()=>{
    const map=mapRef.current,circle=scaleCircleRef.current;
    if(!map||!circle)return;
    const zoom=Number(map.getZoom?.());
    const c=circle.getCenter?.();
    const radius=Number(circle.getRadius?.());
    if(!Number.isFinite(zoom)||!c||!Number.isFinite(radius))return;
    const lat=Number(c.lat());
    const metersPerPixel=(156543.03392*Math.cos(lat*Math.PI/180))/Math.pow(2,zoom);
    const diameterPx=(radius*2)/Math.max(.0001,metersPerPixel);
    const div=map.getDiv?.();
    onCityViewportChange?.({
      diameterPx,
      radiusPx:diameterPx/2,
      mapWidth:div?.clientWidth||0,
      mapHeight:div?.clientHeight||0,
      zoom,
      metersPerPixel
    });
  };

  const fitScale=()=>{
    const map=mapRef.current,circle=scaleCircleRef.current;
    if(!map||!circle)return;
    const bounds=circle.getBounds?.();
    if(bounds)map.fitBounds(bounds,fullscreen?90:65);
    setTimeout(publishCityViewport,80);
  };

  const resolveCityCenter=async(maps,point)=>{
    if(!point||!maps?.Geocoder)return;
    const key=`${Number(point.lat).toFixed(3)},${Number(point.lng).toFixed(3)}`;
    if(resolvedCityKey.current===key)return;
    resolvedCityKey.current=key;
    try{
      const geocoder=new maps.Geocoder();
      const {results}=await geocoder.geocode({location:{lat:Number(point.lat),lng:Number(point.lng)}});
      if(!results?.length)return;
      const preferred=results.find(r=>r.types?.includes('locality')) || results.find(r=>r.types?.includes('postal_town')) || results.find(r=>r.types?.includes('administrative_area_level_3')) || results[0];
      const localityComponent=preferred.address_components?.find(c=>c.types?.includes('locality')) || preferred.address_components?.find(c=>c.types?.includes('postal_town')) || preferred.address_components?.find(c=>c.types?.includes('administrative_area_level_3'));
      const center={lat:preferred.geometry.location.lat(),lng:preferred.geometry.location.lng()};
      let regionRadius=Number(radiusMeters)||804.672;
      const viewport=preferred.geometry.viewport;
      if(viewport){
        const ne=viewport.getNorthEast(),sw=viewport.getSouthWest();
        const corners=[
          {lat:ne.lat(),lng:ne.lng()},
          {lat:ne.lat(),lng:sw.lng()},
          {lat:sw.lat(),lng:ne.lng()},
          {lat:sw.lat(),lng:sw.lng()}
        ];
        regionRadius=Math.max(...corners.map(c=>distanceMeters(center,c)),regionRadius);
      }
      onCityCenterChange?.({
        ...center,
        label:localityComponent?.long_name || preferred.formatted_address || 'City center',
        radiusMeters:regionRadius
      });
    }catch{
      // Keep the existing map fully usable if reverse geocoding is unavailable.
    }
  };

  useEffect(()=>{
    let cancelled=false;
    loadGoogleMaps().then(maps=>{
      if(cancelled||!el.current||initialized.current)return;
      mapsRef.current=maps;
      const map=new maps.Map(el.current,{
        center:effectiveCenter,zoom:17,mapTypeId:'roadmap',streetViewControl:true,fullscreenControl:false,mapTypeControl:true,clickableIcons:true,
        backgroundColor:'#050713',
        styles:[
          {elementType:'geometry',stylers:[{color:'#101827'}]},
          {elementType:'labels.text.fill',stylers:[{color:'#b9c3d4'}]},
          {elementType:'labels.text.stroke',stylers:[{color:'#080d18'}]},
          {featureType:'administrative.locality',elementType:'labels.text.fill',stylers:[{color:'#f3e6b3'}]},
          {featureType:'poi',elementType:'geometry',stylers:[{color:'#111b2a'}]},
          {featureType:'poi',elementType:'labels.text.fill',stylers:[{color:'#7f8da4'}]},
          {featureType:'road',elementType:'geometry',stylers:[{color:'#263348'}]},
          {featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#111827'}]},
          {featureType:'road',elementType:'labels.text.fill',stylers:[{color:'#c5cfdd'}]},
          {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#3d4b61'}]},
          {featureType:'road.highway',elementType:'geometry.stroke',stylers:[{color:'#141d2b'}]},
          {featureType:'transit',elementType:'geometry',stylers:[{color:'#182334'}]},
          {featureType:'water',elementType:'geometry',stylers:[{color:'#07111e'}]},
          {featureType:'water',elementType:'labels.text.fill',stylers:[{color:'#6687a8'}]}
        ]
      });
      mapRef.current=map;initialized.current=true;
      scaleCircleRef.current=new maps.Circle({center:effectiveCenter,radius:effectiveRadius,map,strokeColor:'#F4C842',strokeOpacity:.72,strokeWeight:2,fillColor:'#F4C842',fillOpacity:0,clickable:false});
      cityMarkerRef.current=new maps.Marker({position:effectiveCenter,map,title:'Geographic wheel center',zIndex:20,icon:{path:maps.SymbolPath.CIRCLE,scale:5,fillColor:'#F4C842',fillOpacity:.9,strokeColor:'#ffffff',strokeWeight:1.5}});
      userMarkerRef.current=new maps.Marker({position:location,map,title:'You are here',zIndex:30,icon:{path:maps.SymbolPath.CIRCLE,scale:8,fillColor:'#2563eb',fillOpacity:1,strokeColor:'#ffffff',strokeWeight:2}});
      analysisMarkerRef.current=new maps.Marker({position:analysisLocation||location,map,title:'Astrology calculation position',zIndex:25,icon:{path:maps.SymbolPath.CIRCLE,scale:4,fillColor:'#F4C842',fillOpacity:.9,strokeColor:'#171717',strokeWeight:1}});
      if(destination){destMarkerRef.current=new maps.Marker({position:destination,map,title:'Destination'});routeRef.current=new maps.Polyline({path:[location,destination],map,geodesic:true,strokeColor:'#ffffff',strokeOpacity:.72,strokeWeight:3});}

      maps.event.addListener(map,'zoom_changed',()=>setTimeout(publishCityViewport,0));
      maps.event.addListener(map,'idle',publishCityViewport);
      maps.event.addListener(map,'center_changed',()=>{ if(cityCentered) setTimeout(publishCityViewport,0); });

      const panorama=map.getStreetView?.();
      panoramaRef.current=panorama||null;
      if(panorama){
        const publish=()=>{
          const visible=!!panorama.getVisible?.();
          const pov=panorama.getPov?.()||{};
          onStreetViewChange?.(visible);
          onStreetPovChange?.({heading:Number(pov.heading)||0,pitch:Number(pov.pitch)||0,zoom:Number(pov.zoom)||0});
        };
        maps.event.addListener(panorama,'visible_changed',publish);
        maps.event.addListener(panorama,'pov_changed',publish);
        publish();
      }

      resolveCityCenter(maps,location);
      setTimeout(fitScale,40);setError('');
    }).catch(e=>!cancelled&&setError(e.message||'Google Maps failed to load.'));
    return()=>{cancelled=true};
  },[]);

  useEffect(()=>{
    if(!mapRef.current||!location)return;
    userMarkerRef.current?.setPosition(location);
    if(routeRef.current&&destination)routeRef.current.setPath([location,destination]);
    resolveCityCenter(mapsRef.current,location);
    if(!cityCentered&&followUser)mapRef.current.panTo(location);
  },[location?.lat,location?.lng,followUser,destination?.lat,destination?.lng,cityCentered]);

  useEffect(()=>{
    const map=mapRef.current,circle=scaleCircleRef.current;
    if(!map)return;
    const center=cityCentered&&cityCenter?cityCenter:location;
    if(!center)return;
    circle?.setCenter(center);
    cityMarkerRef.current?.setPosition(center);
    if(cityCentered){
      map.panTo(center);
      setTimeout(fitScale,30);
    }
  },[cityCentered,cityCenter?.lat,cityCenter?.lng]);

  useEffect(()=>{if(!analysisLocation)return;analysisMarkerRef.current?.setPosition(analysisLocation)},[analysisLocation?.lat,analysisLocation?.lng]);

  useEffect(()=>{
    const circle=scaleCircleRef.current;if(!circle)return;
    circle.setRadius(Math.max(15,Number(effectiveRadius)||804.672));
    if(cityCentered)setTimeout(fitScale,20);
    setTimeout(publishCityViewport,40);
  },[radiusMeters,cityRadiusMeters,cityCentered]);

  useEffect(()=>{const map=mapRef.current;if(!map)return;const center=map.getCenter?.();const zoom=map.getZoom?.();const timers=[0,80,220,500].map(delay=>setTimeout(()=>{window.google?.maps?.event?.trigger(map,'resize');if(center)map.setCenter(center);if(Number.isFinite(zoom))map.setZoom(zoom);if(cityCentered&&cityCenter)map.panTo(cityCenter);else if(followUser&&location)map.panTo(location);publishCityViewport();},delay));return()=>timers.forEach(clearTimeout)},[fullscreen]);

  return <div className="google-map-shell">{error?<div className="map-error">{error}</div>:null}<div ref={el} className="google-map"/></div>;
}
