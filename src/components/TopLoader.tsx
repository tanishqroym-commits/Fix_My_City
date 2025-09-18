import React from "react";

export const TopLoader = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return <div className="fixed top-0 left-0 right-0 h-1 bg-primary/70 animate-pulse z-50" />;
};
