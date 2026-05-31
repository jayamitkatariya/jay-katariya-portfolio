const orbs = [
  { color: 'rgba(168, 85, 247, 0.12)', darkColor: 'rgba(168, 85, 247, 0.07)', size: 600, x: '15%', y: '20%' },
  { color: 'rgba(59, 130, 246, 0.10)', darkColor: 'rgba(59, 130, 246, 0.06)', size: 500, x: '70%', y: '40%' },
  { color: 'rgba(16, 185, 129, 0.08)', darkColor: 'rgba(16, 185, 129, 0.05)', size: 450, x: '40%', y: '70%' },
  { color: 'rgba(245, 158, 11, 0.06)', darkColor: 'rgba(245, 158, 11, 0.04)', size: 400, x: '85%', y: '80%' },
];

export default function AmbientGlow() {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: isDark ? orb.darkColor : orb.color,
            filter: 'blur(120px)',
            left: orb.x,
            top: orb.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
