import {
  Home,
  Monitor,
  Shirt,
  LampDesk,
  Gamepad2,
  Puzzle,
  PawPrint,
  Car,
  Dumbbell,
  Book,
  Package,
  type LucideIcon,
} from "lucide-react";

export const iconById: Record<number, LucideIcon> = {
  1: Home, // 생활/가전
  2: Monitor, // 디지털/전자기기
  3: Shirt, // 패션/잡화
  4: LampDesk, // 인테리어
  5: Gamepad2, // 취미용품
  6: Puzzle, // 아동/완구
  7: PawPrint, // 반려동물
  8: Car, // 차량용품
  9: Dumbbell, // 스포츠/레저
  10: Book, // 도서/문구
};

export const getCategoryIcon = (id?: number): LucideIcon =>
  (id && iconById[id]) || Package;
