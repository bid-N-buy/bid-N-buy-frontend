import React from "react";
import type { AvatarProps } from "../types/CommonType";
import avatar from "../../assets/avatar.svg";
import { buildImageUrl } from "../utils/imageUrl";

const Avatar = ({ imageUrl, nickname, size }: AvatarProps) => {
  return (
    <div className={`size-${size ? size : 16} overflow-hidden rounded-full`}>
      {
        <img
          src={imageUrl ? buildImageUrl(imageUrl) : avatar}
          alt={`${nickname}의 프로필 사진`}
        />
      }
    </div>
  );
};

export default Avatar;
