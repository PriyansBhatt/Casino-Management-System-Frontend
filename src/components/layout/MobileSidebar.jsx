import Sidebar from "./Sidebar";
import { cn } from "../../utils/cn";

const MobileSidebar = ({ isOpen, onClose }) => {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !isOpen && "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-gray-950/60 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 w-72 max-w-[85vw] transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar isMobile onNavigate={onClose} />
      </aside>
    </div>
  );
};

export default MobileSidebar;
