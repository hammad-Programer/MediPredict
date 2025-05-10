// src/Pages/Admin/AdminDashboard.jsx
import React, { useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faStethoscope,
  faUser,
  faComments,
  faBullhorn,
  faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";


import AppContext from "../../Context/AppContext";
import { toast } from "sonner";
import logo from "../../assets/Logo- Blue.svg";

const AdminDashboard = () => {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/admin-login");
  };

  const navItemClasses = (path) =>
    `flex items-center px-6 py-3 cursor-pointer transition relative group ${
      location.pathname === path
        ? "text-blue-600 font-bold pr-5 border-r-4 border-blue-500 bg-blue-50"
        : "text-gray-600 font-bold pr-5 hover:bg-gray-50 hover:border-r-4 hover:border-blue-500"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="w-full bg-white shadow-lg z-10 flex justify-between items-center px-6 py-4 sticky top-0">
        <div className="flex items-center">
          <img
            src={logo}
            alt="MediPredict Logo"
            className="h-4 w-auto sm:h-6 object-contain"
          />
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />
          Logout
        </button>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 mt-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md border-r">
          <nav className="pt-6">
          <ul className="space-y-1">
  <li>
    <div
      onClick={() => navigate("/Admin")}
      className={navItemClasses("/Admin")}
    >
      <FontAwesomeIcon icon={faHouse} className="mr-3 w-4 h-4" />
      Dashboard
    </div>
  </li>

  <li>
    <div
      onClick={() => navigate("/admin/doctors")}
      className={navItemClasses("/admin/doctors")}
    >
      <FontAwesomeIcon icon={faStethoscope} className="mr-3 w-4 h-4" />
      Doctor
    </div>
  </li>

  <li>
    <div
      onClick={() => navigate("/admin/patients")}
      className={navItemClasses("/admin/patients")}
    >
      <FontAwesomeIcon icon={faUser} className="mr-3 w-4 h-4" />
      Patient
    </div>
  </li>

  <li>
    <div
      onClick={() => navigate("/admin/feedbacks")}
      className={navItemClasses("/admin/feedbacks")}
    >
      <FontAwesomeIcon icon={faComments} className="mr-3 w-4 h-4" />
      Feedbacks
    </div>
  </li>

  <li>
    <div
      onClick={() => navigate("/admin/announcements")}
      className={navItemClasses("/admin/announcements")}
    >
      <FontAwesomeIcon icon={faBullhorn} className="mr-3 w-4 h-4" />
      Announcements
    </div>
  </li>
</ul>


          </nav>
        </aside>

        {/* Main Content Outlet */}
        <main className="flex-1 p-8 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
