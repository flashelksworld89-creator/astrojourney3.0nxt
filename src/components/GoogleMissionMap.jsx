import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMaps';

export default function GoogleMissionMap({location,analysisLocation,destination,fullscreen,radiusMeters=804.672,followUser=true,onOverlayMetrics}) {
  const el=useRef(null),mapRef=useRef(null),mapsRef=useRef(null),userMarkerRef=useRef(null),analysisMarkerRef=useRef(null),destMarkerRef=useRef(null),routeRef=useRef(null),scaleCircleRef=useRef(null),overlayRef=useRef(null),initialized=useRef(false),firstFitDone=useRef(false),rafRef=useRef(null);
  const [error,setError]=useState('');

  const publishMetrics=()=>{
    const map=mapRef.current, maps=mapsRef.current, overlay=overlayRef.current;
    if(!map||!maps||!location)return;
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    rafRef.current=requestAnimationFrame(()=>{
      const zoom=map.getZoom?.()??17;
      const lat=Number(location.lat)||0;
      const metersPerPixel=156543.03392*Math.cos(lat*Math.PI/180)/Math.pow(2,zoom);
      const diameterPx=Math.max(70,(2*Math.max(15,Number(radiusMeters)||152.4))/Math.max(.01,metersPerPixel));
      let userX=null,userY=null;
      try{
        const projection=overlay?.getProjection?.();
        if(projection){
          const px=projection.fromLatLngToDivPixel(new maps.LatLng(location));
          if(px){userX=px.x;userY=px.y;}
        }
      }catch{}
      onOverlayMetrics?.({diameterPx,userX,userY,zoom,metersPerPixel});
    });
  };

  const fitInitialScale=()=>{
    const map=mapRef.current,circle=scaleCircleRef.current;
    if(!map||!circle||firstFitDone.current)return;
    const bounds=circle.getBounds?.();
    if(bounds){map.fitBounds(bounds,fullscreen?72:54);firstFitDone.current=true;}
  };

  useEffect(()=>{
    let cancelled=false;
    const listeners=[];
    loadGoogleMaps().then(maps=>{
      if(cancelled||!el.current||initialized.current)return;
      mapsRef.current=maps;
      const map=new maps.Map(el.current,{center:location,zoom:17,mapTypeId:'roadmap',streetViewControl:true,fullscreenControl:false,mapTypeControl:true,clickableIcons:true,gestureHandling:'greedy'});
      mapRef.current=map;initialized.current=true;
      scaleCircleRef.current=new maps.Circle({center:location,radius:radiusMeters,map,strokeColor:'#F4C842',strokeOpacity:.56,strokeWeight:1.8,fillColor:'#F4C842',fillOpacity:.012,clickable:false});
      userMarkerRef.current=new maps.Marker({position:location,map,title:'Live device position',zIndex:30,icon:{path:maps.SymbolPath.CIRCLE,scale:8,fillColor:'#2563eb',fillOpacity:1,strokeColor:'#ffffff',strokeWeight:2}});
      analysisMarkerRef.current=new maps.Marker({position:analysisLocation||location,map,title:'Astrology calculation position',zIndex:25,icon:{path:maps.SymbolPath.CIRCLE,scale:4,fillColor:'#F4C842',fillOpacity:.9,strokeColor:'#171717',strokeWeight:1}});
      if(destination){destMarkerRef.current=new maps.Marker({position:destination,map,title:'Destination'});routeRef.current=new maps.Polyline({path:[location,destination],map,geodesic:true,strokeColor:'#ffffff',strokeOpacity:.78,strokeWeight:3});}

      const overlay=new maps.OverlayView();
      overlay.onAdd=()=>{};overlay.onRemove=()=>{};overlay.draw=publishMetrics;overlay.setMap(map);overlayRef.current=overlay;
      ['zoom_changed','center_changed','bounds_changed','idle'].forEach(name=>listeners.push(map.addListener(name,publishMetrics)));
      setTimeout(()=>{fitInitialScale();publishMetrics();},80);setError('');
    }).catch(e=>!cancelled&&setError(e.message||'Google Maps failed to load.'));
    return()=>{cancelled=true;if(rafRef.current)cancelAnimationFrame(rafRef.current);listeners.forEach(l=>l?.remove?.());overlayRef.current?.setMap?.(null)};
  },[]);

  useEffect(()=>{
    if(!mapRef.current||!location)return;
    userMarkerRef.current?.setPosition(location);
    scaleCircleRef.current?.setCenter(location);
    if(routeRef.current&&destination)routeRef.current.setPath([location,destination]);
    if(followUser)mapRef.current.panTo(location);
    publishMetrics();
  },[location?.lat,location?.lng,followUser,destination?.lat,destination?.lng]);

  useEffect(()=>{if(!analysisLocation)return;analysisMarkerRef.current?.setPosition(analysisLocation)},[analysisLocation?.lat,analysisLocation?.lng]);

  // Radius changes resize the geographic circle and overlay only. They deliberately
  // do not call fitBounds, so the wheel visibly expands/contracts at the same map zoom.
  useEffect(()=>{const circle=scaleCircleRef.current;if(!circle)return;circle.setRadius(Math.max(15,Number(radiusMeters)||152.4));publishMetrics()},[radiusMeters]);

  useEffect(()=>{
    const map=mapRef.current;
    if(!map)return;
    const center=map.getCenter?.();
    const zoom=map.getZoom?.();
    const timers=[];
    const refresh=()=>{
      const maps=mapsRef.current||window.google?.maps;
      maps?.event?.trigger?.(map,'resize');
      if(center)map.setCenter(center);
      if(Number.isFinite(zoom))map.setZoom(zoom);
      publishMetrics();
    };
    requestAnimationFrame(refresh);
    [80,220,500].forEach(ms=>timers.push(setTimeout(refresh,ms)));
    return()=>timers.forEach(clearTimeout);
  },[fullscreen]);

  return <div className="google-map-shell">{error?<div className="map-error">{error}</div>:null}<div ref={el} className="google-map"/></div>;
}
