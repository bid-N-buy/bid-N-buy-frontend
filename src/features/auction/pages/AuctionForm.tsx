import React, { useState } from "react";
import { Camera } from "lucide-react";

const AuctionForm = () => {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category1, setCategory1] = useState("");
  const [category2, setCategory2] = useState("");

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-[60px]">
        <h3 className="border-g400 text-g100 border-b pb-4">경매 등록</h3>

        {/* 이미지 */}
        <div className="flex items-start">
          <div className="w-40 flex-shrink-0">
            <label htmlFor="images" className="text-g100 text-base font-medium">
              상품 이미지
            </label>
            <span className="text-g300 text-h7"> (0/10)</span>
          </div>
          <div className="flex-1">
            <label
              htmlFor="images"
              className="bg-g500 hover:bg-g400 flex h-[200px] w-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-md transition-colors"
            >
              <Camera className="text-g200 h-8 w-8" />
              <span className="text-g200 text-h7">이미지 등록</span>
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
        </div>

        {/* 상품명 */}
        <div className="flex items-center">
          <label
            htmlFor="productName"
            className="text-g100 w-40 flex-shrink-0 text-base font-medium"
          >
            상품명
          </label>
          <div className="flex-1">
            <div className="field">
              <input
                id="productName"
                type="text"
                placeholder="상품명을 입력해 주세요."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="field-input placeholder-muted"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="flex items-center">
          <label className="text-g100 w-40 flex-shrink-0 text-base font-medium">
            카테고리
          </label>
          <div className="grid flex-1 grid-cols-2 gap-[10px]">
            <select
              value={category1}
              onChange={(e) => setCategory1(e.target.value)}
              className="border-g400 focus:border-purple cursor-pointer appearance-none rounded-md border bg-white px-3 py-2.5 text-base focus:outline-none"
            >
              <option value="">대분류</option>
              <option value="category1">카테고리 1</option>
              <option value="category2">카테고리 2</option>
            </select>
            <select
              value={category2}
              onChange={(e) => setCategory2(e.target.value)}
              className="border-g400 focus:border-purple cursor-pointer appearance-none rounded-md border bg-white px-3 py-2.5 text-base focus:outline-none"
            >
              <option value="">소분류</option>
              <option value="sub1">소분류 1</option>
              <option value="sub2">소분류 2</option>
            </select>
          </div>
        </div>

        {/* 상품 설명 */}
        <div className="flex items-start">
          <label
            htmlFor="description"
            className="text-g100 w-40 flex-shrink-0 pt-3 text-base font-medium"
          >
            상품 설명
          </label>
          <div className="relative flex-1">
            <div className="field">
              <textarea
                id="description"
                placeholder="구매 시기, 하자 유무 등 최대한 자세히 설명을 적어 주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field-input placeholder-muted h-[200px] resize-none"
                maxLength={2000}
              />
            </div>
            <div className="text-g300 text-h8 absolute right-3 bottom-2">
              {description.length}/2000
            </div>
          </div>
        </div>

        {/* 시작가, 최소 입찰 단위 */}
        <div>
          <div className="grid grid-cols-2 gap-[30px]">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="startPrice"
                className="text-g100 text-base font-medium"
              >
                시작가
              </label>
              <div className="field">
                <input
                  id="startPrice"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="시작가"
                  className="field-input placeholder-muted"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="minBidPrice"
                className="text-g100 text-base font-medium"
              >
                최소 입찰 단위
              </label>
              <div className="field">
                <input
                  id="minBidPrice"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="최소 입찰 단위"
                  className="field-input placeholder-muted"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 시작, 마감일시 */}
        <div>
          <div className="grid grid-cols-2 gap-[30px]">
            {/* 시작 */}
            <div>
              <label className="text-g100 mb-4 block text-base font-medium">
                시작일시
              </label>
              <div className="flex gap-[10px]">
                {/* 날짜 */}
                <div className="field flex-[3]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="YYYY - MM - DD"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                  />
                </div>

                {/* 시간 */}
                <div className="field flex-[2]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="AM  00 : 00"
                    onFocus={(e) => (e.target.type = "time")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                  />
                </div>
              </div>
            </div>

            {/* 마감 */}
            <div>
              <label className="text-g100 mb-4 block text-base font-medium">
                마감일시
              </label>
              <div className="flex gap-[10px]">
                {/* 날짜 */}
                <div className="field flex-[3]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="YYYY - MM - DD"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                  />
                </div>

                {/* 시간 */}
                <div className="field flex-[2]">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="AM  00 : 00"
                    onFocus={(e) => (e.target.type = "time")}
                    onBlur={(e) => !e.target.value && (e.target.type = "text")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[30px]">
          <button className="border-purple text-purple hover:bg-light-purple rounded-md border py-4 font-medium transition-colors">
            취소
          </button>
          <button className="bg-purple hover:bg-deep-purple rounded-md py-4 font-medium text-white transition-colors">
            등록
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionForm;
