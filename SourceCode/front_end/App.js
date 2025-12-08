import React, { useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import AdminScreen from "./screens/AdminScreen";
import UserScreen from "./screens/UserScreen";

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState(null);

  return (
    <>
      {isLogin ? (
        role === "admin" ? (
          <AdminScreen setIsLogin={setIsLogin} setRole={setRole} />
        ) : (
          <UserScreen setIsLogin={setIsLogin} setRole={setRole} />
        )
      ) : (
        <LoginScreen setIsLogin={setIsLogin} setRole={setRole} />
      )}
    </>
  );
}
