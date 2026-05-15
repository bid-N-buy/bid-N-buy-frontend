import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChatModalStore } from "./ChatModalStore";
import { useAuthStore } from "../../features/auth/store/authStore";
import type { ChatListItemProps, ChatMessageProps } from "../../features/chatting/types/ChatType";

vi.mock("../api/axiosInstance", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockChatList: ChatListItemProps[] = [
  {
    chatroomId: 1,
    auctionId: 101,
    auctionTitle: "테스트 경매 1",
    auctionImageUrl: null,
    counterpartId: 2,
    counterpartNickname: "상대방A",
    counterpartProfileImageUrl: null,
    lastMessageTime: "2024-01-01T00:00:00.000Z", // 오래된 메시지 (목록 하단)
    lastMessagePreview: "이전 텍스트 메시지",
    unreadCount: 0,
  },
  {
    chatroomId: 2,
    auctionId: 102,
    auctionTitle: "테스트 경매 2",
    auctionImageUrl: null,
    counterpartId: 3,
    counterpartNickname: "상대방B",
    counterpartProfileImageUrl: null,
    lastMessageTime: "2024-01-02T00:00:00.000Z", // 최신 메시지 (목록 상단)
    lastMessagePreview: "최신 메시지",
    unreadCount: 1,
  },
];

const makeImageMessage = (override: Partial<ChatMessageProps> = {}): ChatMessageProps => ({
  chatmessageId: 10,
  chatroomId: 1,
  senderId: 2,
  imageUrl: "https://example.com/image.jpg",
  message: "사진을 보냈습니다.",
  messageType: "IMAGE",
  createdAt: null as unknown as string,
  read: false,
  ...override,
});

const sortByTime = (list: ChatListItemProps[]) =>
  [...list].sort(
    (a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

describe("handleNewChatMessage", () => {
  beforeEach(() => {
    useAuthStore.setState({ userId: 1 });
    useChatModalStore.setState({
      chatList: [...mockChatList],
      selectedChatroomId: null,
      totalUnreadCount: 1,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. createdAt 폴백 ─────────────────────────────────────────────────────

  describe("createdAt 폴백", () => {
    it("createdAt이 null이면 1970년이 아닌 현재 시각으로 대체되어야 한다", async () => {
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage(makeImageMessage({ createdAt: null as unknown as string }));

      const { chatList } = useChatModalStore.getState();
      const room = chatList.find((item) => item.chatroomId === 1)!;

      const timestamp = new Date(room.lastMessageTime).getTime();
      expect(isNaN(timestamp)).toBe(false);
      expect(new Date(room.lastMessageTime).getFullYear()).toBeGreaterThan(1970);
    });

    it("createdAt이 undefined이면 1970년이 아닌 현재 시각으로 대체되어야 한다", async () => {
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage(makeImageMessage({ createdAt: undefined as unknown as string }));

      const { chatList } = useChatModalStore.getState();
      const room = chatList.find((item) => item.chatroomId === 1)!;

      const timestamp = new Date(room.lastMessageTime).getTime();
      expect(isNaN(timestamp)).toBe(false);
      expect(new Date(room.lastMessageTime).getFullYear()).toBeGreaterThan(1970);
    });

    it("유효한 createdAt이 있으면 해당 값을 그대로 사용해야 한다", async () => {
      const validDate = "2025-06-01T12:00:00.000Z";
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage(makeImageMessage({ createdAt: validDate }));

      const { chatList } = useChatModalStore.getState();
      const room = chatList.find((item) => item.chatroomId === 1)!;

      expect(room.lastMessageTime).toBe(validDate);
    });
  });

  // ── 2. 채팅 목록 정렬 ──────────────────────────────────────────────────────

  describe("채팅 목록 정렬", () => {
    it("이미지 메시지(createdAt=null) 수신 후 해당 채팅방이 목록 최상단으로 이동해야 한다", async () => {
      // 초기 상태: chatroomId=2가 상단, chatroomId=1이 하단
      expect(sortByTime(mockChatList)[0].chatroomId).toBe(2);

      const { handleNewChatMessage } = useChatModalStore.getState();
      await handleNewChatMessage(makeImageMessage({ chatroomId: 1 }));

      const { chatList } = useChatModalStore.getState();
      expect(sortByTime(chatList)[0].chatroomId).toBe(1);
    });

    it("텍스트 메시지(유효한 createdAt) 수신 후에도 정렬이 정상 동작해야 한다", async () => {
      const recentDate = "2099-12-31T23:59:59.000Z";
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage({
        chatmessageId: 20,
        chatroomId: 1,
        senderId: 2,
        imageUrl: null,
        message: "안녕하세요",
        messageType: "CHAT",
        createdAt: recentDate,
        read: false,
      });

      const { chatList } = useChatModalStore.getState();
      const top = sortByTime(chatList)[0];
      expect(top.chatroomId).toBe(1);
      expect(top.lastMessageTime).toBe(recentDate);
    });
  });

  // ── 3. unreadCount ────────────────────────────────────────────────────────

  describe("unreadCount", () => {
    it("내가 보낸 메시지이면 unreadCount가 증가하지 않아야 한다", async () => {
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage(makeImageMessage({ senderId: 1 })); // userId=1 본인 전송

      const { chatList } = useChatModalStore.getState();
      const room = chatList.find((item) => item.chatroomId === 1)!;
      expect(room.unreadCount).toBe(0);
    });

    it("상대방 메시지이고 해당 방에 입장하지 않은 상태이면 unreadCount가 1 증가해야 한다", async () => {
      useChatModalStore.setState({ selectedChatroomId: null });
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage(makeImageMessage({ senderId: 2 })); // 상대방 전송

      const { chatList } = useChatModalStore.getState();
      const room = chatList.find((item) => item.chatroomId === 1)!;
      expect(room.unreadCount).toBe(1); // 기존 0 + 1
    });

    it("해당 방에 입장해 있는 상태이면 상대방 메시지여도 unreadCount가 증가하지 않아야 한다", async () => {
      useChatModalStore.setState({ selectedChatroomId: 1 }); // 1번 방에 입장 중
      const { handleNewChatMessage } = useChatModalStore.getState();

      await handleNewChatMessage(makeImageMessage({ senderId: 2 }));

      const { chatList } = useChatModalStore.getState();
      const room = chatList.find((item) => item.chatroomId === 1)!;
      expect(room.unreadCount).toBe(0);
    });
  });
});
