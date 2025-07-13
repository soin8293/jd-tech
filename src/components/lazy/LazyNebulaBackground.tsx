import { lazy, Suspense } from "react";

const NebulaBackground = lazy(() => import("@/components/backgrounds/NebulaBackground"));

const LazyNebulaBackground = () => {
  return (
    <Suspense fallback={<div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400" />}>
      <NebulaBackground />
    </Suspense>
  );
};

export default LazyNebulaBackground;