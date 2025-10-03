type RelatedItemProps = {
  title?: string;
};

const RelatedItem = ({ title = "상품" }: RelatedItemProps) => {
  // 308 x 232 (파일 기준)
  return <div className="bg-g400 h-[232px] w-full" aria-label={title} />;
};

export default RelatedItem;
