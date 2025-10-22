import React from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-g500 text-g200 text-h7 w-full py-8">
      <div className="mx-auto px-6 lg:px-10 xl:px-40">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* 좌측 policy + 문의 */}
          <div>
            <h2 className="mb-1.5 text-base font-semibold">Bid&Buy</h2>

            <div className="mb-1.5">
              <a
                href="https://www.notion.so/bid-n-buy/Bid-Buy-2946456150d3809f8660eb6895052e60?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                이용약관 및 개인정보처리방침
              </a>
            </div>

            <div>
              <Link to="/mypage/inquiries" className="hover:text-white">
                문의하기
              </Link>
            </div>
          </div>

          {/* 우측 github 아이콘 */}
          <div className="flex items-start">
            <a
              href="https://github.com/bid-N-buy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
              aria-label="GitHub"
            >
              <Github className="h-7 w-7" />
            </a>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="border-g400 text-g300 text-h8 mt-6 border-t pt-4 text-center">
          © 2025 Bid&Buy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
