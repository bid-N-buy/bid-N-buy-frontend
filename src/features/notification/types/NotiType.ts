export interface NotiModalProps {
  notis: NotiListProps[];
  onChatAdd?: (auctionId: number, sellerId: number) => void; 
}

export interface NotiListProps {
  notificationId: bigint;
  userId?: bigint;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
  deletedAt: string | null;
   auctionId?: number; 
  sellerId?: number;  
  onClick?: () => void;
}