type AvatarProps = {
  src?: string;
  name: string;
  size?: number;
};

export function Avatar({ src, name, size = 44 }: AvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full border-2 border-white bg-electric-blue text-sm font-semibold text-white"
    >
      {initials}
    </div>
  );
}
