import { useState, useEffect } from 'react';
import FeatureNotAvailable from '../components/Common/FeatureNotAvailable';

export const useFeatureNotAvailable = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleShow = (event: CustomEvent) => {
      setMessage(event.detail.message || "This feature does not exist yet");
    };

    window.addEventListener('show-feature-not-available', handleShow as EventListener);

    return () => {
      window.removeEventListener('show-feature-not-available', handleShow as EventListener);
    };
  }, []);

  const show = (msg?: string) => {
    setMessage(msg || "This feature does not exist yet");
  };

  return { show, Notification: message ? <FeatureNotAvailable message={message} /> : null };
};

