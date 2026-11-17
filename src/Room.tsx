import type { Settings } from "./model";
import ClassicRoom from "./ClassicRoom";
import PaintedRoom from "./PaintedRoom";
export default function Room(props: {
  settings: Settings;
  decor: string[];
  focused?: boolean;
  mini?: boolean;
}) {
  return props.settings.roomStyle === "drawn" ? (
    <ClassicRoom {...props} />
  ) : (
    <PaintedRoom {...props} />
  );
}
