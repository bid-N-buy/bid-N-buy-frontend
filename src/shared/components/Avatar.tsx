import React from "react";
import type { AvatarProps } from "../types/CommonType";
import { profile_default } from "../types/CommonType";

const Avatar = ({ image_url, nickname }: AvatarProps) => {
  return (
    <div className="size-12 overflow-hidden rounded-full">
      <img
        src={image_url ? image_url : profile_default}
        alt={`${nickname}의 프로필 사진`}
      />
    </div>
  );
};

export default Avatar;
