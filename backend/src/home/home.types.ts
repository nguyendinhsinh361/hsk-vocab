/** Dữ liệu màn Trang chủ (mobile + desktop). Nguồn: Topic/Root + User. */

/** Gốc từ rút gọn (thẻ "gốc phổ biến", "học tiếp"). */
export interface RootMini {
  id: string;
  hz: string;
  py: string;
  hv: string;
}

/** Nhóm gốc (topic group) trên màn "Khám phá nhóm gốc". */
export interface TopicGroup {
  id: string;
  title: string;
  /** Số gốc từ trong nhóm. */
  rootCount: number;
  /** Gốc đầu tiên để bắt đầu luyện (điều hướng /practice/[startRootId]). */
  startRootId: string | null;
  /** Đang học (đánh dấu badge). */
  active: boolean;
}

export interface HomeData {
  user: {
    name: string;
    level: number;
    /** Số gốc đã học / tổng số gốc (thanh tiến trình). */
    learnedRoots: number;
    totalRoots: number;
  };
  /** Thẻ "Học tiếp" — nhóm đang học + 1 gốc gợi ý. */
  continueLearning: {
    topicTitle: string;
    root: RootMini;
  } | null;
  topicGroups: TopicGroup[];
  popularRoots: RootMini[];
}
