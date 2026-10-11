import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome, FaBook, FaClipboardCheck, FaChartLine, FaBullseye,
  FaUsers, FaBell, FaUserCircle, FaSignOutAlt
} from "react-icons/fa";
import "./MenteeSidebar.css";

const items = [
  ["/mentee-dashboard", "Dashboard", FaHome],
  ["/marks", "Marks", FaBook],
  ["/attendance", "Attendance", FaClipboardCheck],
  ["/cgpa-tracker", "CGPA Tracker", FaChartLine],
  ["/academic-target", "Academic Target", FaBullseye],
  ["/batch-comparison", "Batch Comparison", FaUsers],
  ["/alerts", "Alerts", FaBell],
  ["/mentee-profile", "Profile", FaUserCircle],
];

export default function MenteeSidebar() {
  const navigate = useNavigate();
  return (
    <aside className="mentee-sidebar">
      <div>
        <div className="mentee-logo">TrackWise</div>
        <nav className="mentee-nav">
          {items.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({isActive}) => `mentee-nav-link ${isActive ? "mentee-nav-active" : ""}`}>
              <Icon /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <button className="mentee-logout" onClick={() => {
          localStorage.removeItem("trackwiseToken");
          localStorage.removeItem("trackwiseUser");
          navigate("/login", { replace: true });
        }}>
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}
