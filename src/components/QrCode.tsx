import QRCode from "react-qr-code";

type Props = { value: string; size?: number; className?: string };

export function QrCode({ value, size = 200, className }: Props) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <QRCode
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        value={value}
        viewBox={`0 0 256 256`}
      />
    </div>
  );
}
