// src/features/mypage/pages/InquiryList.tsx
import React from "react";
import { Link } from "react-router-dom";

type Inquiry = {
  id: number;
  type: "문의" | "신고";
  title: string;
  answered: boolean;
  createdAt: string;
};

const mockData: Inquiry[] = [
  {
    id: 1,
    type: "문의",
    title: "문의 드립니다.",
    answered: true,
    createdAt: "25.09.29",
  },
  {
    id: 2,
    type: "문의",
    title: "문의 드립니다.",
    answered: true,
    createdAt: "25.09.29",
  },
  {
    id: 3,
    type: "문의",
    title: "문의 드립니다.",
    answered: true,
    createdAt: "25.09.29",
  },
  {
    id: 4,
    type: "문의",
    title: "문의 드립니다.",
    answered: false,
    createdAt: "25.09.29",
  },
  {
    id: 5,
    type: "신고",
    title: "신고 드립니다.",
    answered: true,
    createdAt: "25.09.29",
  },
  {
    id: 6,
    type: "문의",
    title: "문의 드립니다.",
    answered: true,
    createdAt: "25.09.29",
  },
];

const InquiryList = () => {
  return (
    <div className="mx-auto w-[788px] max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">1:1 문의 / 신고</h2>

        {/* ✅ App 라우팅에 맞춘 절대 경로 */}
        <Link
          to="/mypage/support/inquiries/new"
          className="bg-purple hover:bg-deep-purple rounded-md px-4 py-2 font-medium text-white transition-colors"
        >
          문의/신고
        </Link>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-0">
        <colgroup>
          <col style={{ width: "12%" }} />
          <col style={{ width: "56%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>

        <thead>
          <tr>
            {["분류", "제목", "답변 여부", "작성일"].map((th) => (
              <th
                key={th}
                className="text-g200 border-g400 border-b py-3 text-center text-sm font-semibold"
              >
                {th}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-g100 text-sm">
          {mockData.map((it) => (
            <tr
              key={it.id}
              className="group border-g400 hover:bg-g500/50 cursor-pointer border-b"
            >
              <td className="py-4 text-center align-middle">{it.type}</td>
              <td className="px-2 py-4 align-middle">
                <div className="mx-auto max-w-[560px]">
                  <span
                    title={it.title}
                    className="block truncate text-center group-hover:underline"
                  >
                    {it.title}
                  </span>
                </div>
              </td>
              <td className="py-4 text-center align-middle font-semibold">
                <span className={it.answered ? "text-green" : "text-red"}>
                  {it.answered ? "Y" : "N"}
                </span>
              </td>
              <td className="text-g200 py-4 text-center align-middle">
                {it.createdAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InquiryList;
