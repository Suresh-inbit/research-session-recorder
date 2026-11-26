import React, { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../shared/utils';

/** "5m ago" that keeps itself current — views like the side panel stay open for hours. */
export const RelativeTime: React.FC<{ timestamp: number }> = ({ timestamp }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  return <time dateTime={new Date(timestamp).toISOString()}>{formatRelativeTime(timestamp)}</time>;
};
