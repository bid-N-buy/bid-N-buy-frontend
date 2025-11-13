import React from "react";

type InquiryStatus = "WAITING" | "COMPLETE" | string;

type Props = {
  status?: InquiryStatus;
};

const InquiryStatusBadge = ({ status }: Props) => {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        -
      </span>
    );
  }

  const normalizedStatus = status.toUpperCase();
  const isWaiting = normalizedStatus === "WAITING";
  const isComplete = normalizedStatus === "COMPLETE";

  const statusText = isWaiting ? "답변전" : isComplete ? "답변완료" : status;

  const baseClasses =
    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium";

  let statusClasses = "";
  if (isWaiting) {
    statusClasses = "bg-purple text-white";
  } else if (isComplete) {
    statusClasses = "bg-green text-white";
  } else {
    statusClasses = "bg-gray-100 text-gray-600";
  }

  return (
    <span className={`${baseClasses} ${statusClasses}`}>{statusText}</span>
  );
};

export default InquiryStatusBadge;
