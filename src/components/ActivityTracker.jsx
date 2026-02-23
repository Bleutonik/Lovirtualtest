import { useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

// Tiempo en ms para considerar AFK (3 minutos)
const AFK_THRESHOLD = 3 * 60 * 1000;
// Intervalo de heartbeat (1 minuto)
const HEARTBEAT_INTERVAL = 60 * 1000;

const ActivityTracker = () => {
  const lastActivityRef = useRef(Date.now());
  const isAfkRef = useRef(false);
  const heartbeatIntervalRef = useRef(null);

  // Actualizar ultima actividad
  const updateActivity = useCallback(() => {
    const now = Date.now();
    const wasAfk = isAfkRef.current;

    lastActivityRef.current = now;
    isAfkRef.current = false;

    // Si estaba AFK y volvio, notificar al servidor
    if (wasAfk) {
      api.post('/activity/back', {}).catch(err => {
        console.log('Error reportando actividad:', err);
      });
    }
  }, []);

  // Verificar si esta AFK
  const checkAfkStatus = useCallback(() => {
    const now = Date.now();
    const idleTime = now - lastActivityRef.current;

    if (idleTime >= AFK_THRESHOLD && !isAfkRef.current) {
      isAfkRef.current = true;
      // Notificar al servidor que esta AFK
      api.post('/activity/afk', { idleTime }).catch(err => {
        console.log('Error reportando AFK:', err);
      });
    }
  }, []);

  // Enviar heartbeat
  const sendHeartbeat = useCallback(() => {
    const now = Date.now();
    const idleTime = now - lastActivityRef.current;

    api.post('/activity/heartbeat', {
      isActive: !isAfkRef.current,
      lastActivity: lastActivityRef.current,
      idleTime
    }).catch(err => {
      console.log('Error enviando heartbeat:', err);
    });

    // Verificar estado AFK
    checkAfkStatus();
  }, [checkAfkStatus]);

  useEffect(() => {
    // Eventos a monitorear
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle para no procesar demasiados eventos
    let throttleTimeout = null;
    const throttledUpdate = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        updateActivity();
      }, 1000);
    };

    // Agregar listeners
    events.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Enviar heartbeat inicial
    sendHeartbeat();

    // Configurar intervalo de heartbeat
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Verificar AFK cada 30 segundos
    const afkCheckInterval = setInterval(checkAfkStatus, 30000);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      clearInterval(afkCheckInterval);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [updateActivity, sendHeartbeat, checkAfkStatus]);

  // Este componente no renderiza nada visible
  return null;
};

export default ActivityTracker;
