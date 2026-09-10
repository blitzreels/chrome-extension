import { createRoot } from "react-dom/client";
import "../src/styles.css";
import "../src/showcases/preview.css";
import { initialState } from "../src/contracts";
import { ExtensionShowcase } from "../src/showcases";

function Preview() {
  return (
    <div className="showcase">
      <h1>BlitzReels component showcase</h1>
      <p>
        Design reference. Open the installed Chrome extension to save real video
        moments.
      </p>
      <ExtensionShowcase
        state={initialState}
        selection={null}
        error={null}
        pending={false}
        notice={null}
        removed={null}
        send={async () => false}
        copy={async () => undefined}
        capture={async () => null}
        reload={async () => undefined}
      />
    </div>
  );
}
const mount = document.getElementById("root");
if (mount) createRoot(mount).render(<Preview />);
