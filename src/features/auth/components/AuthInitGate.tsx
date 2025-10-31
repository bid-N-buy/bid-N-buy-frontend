import React from "react";
import { useLocation } from "react-router-dom";
import { useAuthInit } from "../hooks/UseAuthInit";

/** Router 내부에서 pathname을 읽어 훅에 전달 */
const AuthInitGate: React.FC = () => {
  const { pathname } = useLocation();
  useAuthInit(pathname); // 초기화만 수행, UI는 없음
  return null;
};

export default AuthInitGate;
