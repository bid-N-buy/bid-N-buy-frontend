type RelatedCardProps = {
  title?: string;
};

export default function RelatedCard({ title = "상품" }: RelatedCardProps) {
  // 308 x 232 (파일 기준) 고정 높이로 정렬
  return (
    <div className="bg-g400 h-[232px] w-full rounded-xl" aria-label={title} />
  );
}
