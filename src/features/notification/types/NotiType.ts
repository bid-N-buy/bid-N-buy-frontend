export interface NotiModalProps {
  notis: NotiListProps[];
}

export interface NotiListProps {
  notificationId: bigint;
  userId?: bigint;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
  deletedAt: string | null;
}