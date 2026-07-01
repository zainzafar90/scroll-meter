import { useState } from "react";
import { faviconUrl } from "../lib/favicon";

export function Favicon({ host }: { host: string }) {
  const [failed, setFailed] = useState(false);
  const clean = host.replace(/^www\./, "");
  if (failed) {
    return (
      <span className="sw-fav sw-fav-mono" aria-hidden="true">
        {clean.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="sw-fav"
      src={faviconUrl(host)}
      width={20}
      height={20}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
