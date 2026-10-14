type AvatarProps = {
  name: string;
  avatarUrl: string | null;
  size?: string;
};

export default function Avatar({ name, avatarUrl, size = "h-8 w-8" }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${size} shrink-0 rounded-full object-cover ring-1 ring-line`}
      />
    );
  }

  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
