import SpiplAiWidget from "@/components/SpiplAiWidget";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="phone-bg">
      <div className="phone-screen">
        {children}
        <SpiplAiWidget />
      </div>
    </div>
  );
}