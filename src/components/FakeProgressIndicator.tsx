import { useEffect, useMemo, useState } from "react";
import { Progress } from "./ui/progress";

type Point = { x: number; y: number };

function cubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;

  const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

  return { x, y };
}

function getProgress(
  startTime: number,
  duration: number,
  [p0, p1, p2, p3]: [Point, Point, Point, Point],
): number {
  const now = Date.now();
  const elapsed = Math.min(now - startTime, duration);
  const t = elapsed / duration;
  const point = cubicBezier(p0, p1, p2, p3, t);
  return point.y * 100; // progress from 0 to 100
}

export function FakeProgressIndicator() {
  // fake progress indicator
  const [progress, setProgress] = useState(0);

  // const p0 = { x: 0.0, y: 0 };
  // const p1 = { x: 0.42, y: 0 };
  // const p2 = { x: 0.58, y: 1 };
  // const p3 = { x: 1, y: 1 };

  // Cubic Bezier curve
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0.66, y: 0 };
  const p2 = { x: 0.34, y: 1 };
  const p3 = { x: 1, y: 1 };

  const duration = 5_000; // 3 seconds

  const startTime = useMemo(() => Date.now(), []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress = getProgress(startTime, duration, [p0, p1, p2, p3]);
      setProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="w-full flex flex-col justify-center items-center mt-20 gap-4">
      <span className="text-muted-foreground text-sm">
        Setting up the database...
      </span>
      <Progress
        value={progress}
        className="w-[60%] max-w-md text-orange-500 shadow-lg shadow-orange-500"
      />
    </div>
  );
}
