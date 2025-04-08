import React from "react";
import Sun from "../images/sun.svg";
import Moon from "../images/moon.svg";

function getDefaultTheme() {
  // 检查本地存储以获取默认主题
  const savedTheme = window.localStorage.getItem("theme");
  return savedTheme ? savedTheme : "light";
}

export default function DarkMode() {
  const [theme, setTheme] = React.useState(getDefaultTheme());

  React.useEffect(() => {
    // 当主题变化时，更新本地存储
    window.localStorage.setItem("theme", theme);
    
    // 根据主题添加/移除dark类
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="global-toggle-switch">
      <span onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? (
          <img style={{ width: "50px", height: "50px" }} src={Sun} alt="sun img" />
        ) : (
          <img style={{ width: "50px", height: "50px" }} src={Moon} alt="moon img" />
        )}
      </span>
    </div>
  );
}
