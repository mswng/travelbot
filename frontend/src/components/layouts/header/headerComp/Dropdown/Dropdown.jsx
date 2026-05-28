import { useState, useEffect, useRef } from "react";
import "./Dropdown.scss"
// import avatarImg from "../../../../../assets/imgs/image.jpg";

const Dropdown = ({ username, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setShowMenu(prev => !prev);

  // Click ngoài đóng menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="userMenu" ref={menuRef}>
      <img
        src={avatarImg}
        alt="User Avatar"
        className="avatarImg"
        onClick={toggleMenu}
      />
      <span className="username" onClick={toggleMenu}>{username}</span>
    
      {showMenu  && (
        <div className="dropdown">
            <ul>
            <li onClick={onLogout}>Đăng xuất</li>
            </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
