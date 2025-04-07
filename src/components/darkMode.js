import React, { useEffect, useState } from "react";

const DarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 确保只在浏览器环境中运行
    const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(darkModePreference);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle("dark-mode", !isDarkMode);
  };

  return (
    <button onClick={toggleDarkMode}>
      {isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
    </button>
  );
};

export default DarkMode;
