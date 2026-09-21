'use client';

import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import MissionSetup from './components/MissionSetup';

const MissionView = dynamic(() => import('./components/MissionView'), {
  ssr: false,
  loading: () => (
    <main className="app">
      <section className="card loading-chart">Loading mission engine…</section>
    </main>
  ),
});

const KeywordManager = dynamic(() => import('./components/KeywordManager'), {
  ssr: false,
  loading: () => (
    <main className="app">
      <section className="card loading-chart">Loading terminology manager…</section>
    </main>
  ),
});

class RuntimeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('AstroWalk runtime error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app">
          <section className="card error">
            <b>AstroWalk could not open this section.</b>
            <p>{this.state.error?.message || 'An unexpected browser error occurred.'}</p>
            <button type="button" onClick={() => window.location.reload()}>Reload</button>
            {this.props.onBack && <button type="button" onClick={this.props.onBack}>Back to setup</button>}
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function AstroWalkClient() {
  const [adminMode, setAdminMode] = useState(false);
  const [screen, setScreen] = useState('setup');
  const [mission, setMission] = useState(null);
  const [restored, setRestored] = useState(false);
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setAdminMode(params.get('admin') === 'keywords');
    } catch {
      setAdminMode(false);
    }

    try {
      const saved = window.localStorage?.getItem('astrowalk_last_mission');
      setMission(saved ? JSON.parse(saved) : null);
    } catch {
      setMission(null);
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('This browser does not support device location.');
      return undefined;
    }

    const id = navigator.geolocation.watchPosition(
      pos => {
        const c = pos.coords;
        setGps({
          lat: c.latitude,
          lng: c.longitude,
          accuracy: c.accuracy,
          speed: Number.isFinite(c.speed) ? c.speed : null,
          heading: Number.isFinite(c.heading) ? c.heading : null,
          timestamp: pos.timestamp || Date.now(),
          label: `GPS · ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`,
        });
        setGpsError('');
      },
      err => setGpsError(err?.message || 'Location permission is unavailable.'),
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const startMission = data => {
    try {
      window.localStorage?.setItem('astrowalk_last_mission', JSON.stringify(data));
    } catch {
      // Persistence is optional; the mission should still start.
    }
    setMission(data);
    setScreen('mission');
  };

  if (!restored) {
    return <main className="app"><section className="card loading-chart">Loading AstroWalk Journey…</section></main>;
  }

  if (adminMode) {
    return <RuntimeBoundary><div className="app"><KeywordManager /></div></RuntimeBoundary>;
  }

  return (
    <div className="app">
      {screen === 'setup' ? (
        <RuntimeBoundary>
          <MissionSetup initial={mission} gps={gps} gpsError={gpsError} onStart={startMission} />
        </RuntimeBoundary>
      ) : (
        <RuntimeBoundary onBack={() => setScreen('setup')}>
          <MissionView mission={mission} gps={gps} gpsError={gpsError} onBack={() => setScreen('setup')} />
        </RuntimeBoundary>
      )}
    </div>
  );
}
