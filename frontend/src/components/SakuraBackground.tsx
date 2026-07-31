const petals = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 17 + 7) % 100}%`,
  delay: `${(index % 7) * -1.7}s`,
  duration: `${9 + (index % 5) * 2}s`,
  size: `${8 + (index % 4) * 4}px`,
}));

export function SakuraBackground() {
  return <div className="sakura-background" aria-hidden="true">{petals.map((petal, index) => <span key={index} style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration, width: petal.size, height: petal.size }} />)}</div>;
}
