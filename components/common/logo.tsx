import Image from "next/image";

interface LogoProps {
  showTitle?: boolean;
}

function Logo({ showTitle = true }: LogoProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Image src="/logos/logo.svg" alt="Logo" width={100} height={100} className="size-6"/>
      {showTitle && (
        <div>
          <span className="text-lg font-bold ">
            Vekino
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;
