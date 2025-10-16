import { Link } from "react-router-dom";

interface BannerProps {
  src: string; // 배너 이미지 경로
  to: string; // 클릭 시 이동 경로
  alt?: string; // 대체 텍스트
}

const Banner = ({ src, to, alt = "배너" }: BannerProps) => {
  return (
    <Link to={to} className="block aspect-[1320/500] w-full" aria-label={alt}>
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </Link>
  );
};

export default Banner;
