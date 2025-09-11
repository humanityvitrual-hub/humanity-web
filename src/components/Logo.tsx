export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block rounded bg-pink-600"
        style={{ width: size, height: size }}
      />
      <span className="font-semibold tracking-wide">Humanity</span>
    </div>
  );
}
