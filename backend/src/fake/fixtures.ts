// Fake data tạm cho FE chạy khi CHƯA có DB (USE_FAKE_DATA=true).
// Khi có dữ liệu thật → seed vào MySQL và đặt USE_FAKE_DATA=false; shape khớp Prisma model.

export interface FakeCard {
  id: string;
  deckId: string;
  character: string;
  pinyin: string;
  meaning: string | null;
  level: string;
  position: number;
  parentId: string | null;
}

export interface FakeDeck {
  id: string;
  name: string;
  description: string | null;
  level: string;
  position: number;
}

export const FAKE_USER = {
  id: 'demo-user',
  email: 'demo@migii.local',
  name: 'Bạn học HSK',
  avatar: null as string | null,
  xp: 1250,
  level: 4,
  streak: 7,
};

export const FAKE_DECKS: FakeDeck[] = [
  { id: 'people', name: 'Con người', description: 'Gốc từ về con người', level: 'HSK1', position: 0 },
  { id: 'family', name: 'Gia đình', description: 'Gốc từ về gia đình, nhà cửa', level: 'HSK1', position: 1 },
  { id: 'study', name: 'Học tập', description: 'Gốc từ liên quan học hành', level: 'HSK2', position: 2 },
  { id: 'food', name: 'Ăn uống', description: 'Gốc từ về ăn uống', level: 'HSK2', position: 3 },
];

// Mỗi deck: 1 gốc (parentId=null) + các từ ghép.
export const FAKE_CARDS: FakeCard[] = [
  // people — 人
  card('people-ren', 'people', '人', 'rén', 'nhân - người', 'HSK1', 0, null),
  card('people-renren', 'people', '人人', 'rén rén', 'mọi người', 'HSK1', 1, 'people-ren'),
  card('people-daren', 'people', '大人', 'dà rén', 'người lớn', 'HSK1', 2, 'people-ren'),
  card('people-haoren', 'people', '好人', 'hǎo rén', 'người tốt', 'HSK1', 3, 'people-ren'),
  card('people-nanren', 'people', '男人', 'nán rén', 'đàn ông', 'HSK1', 4, 'people-ren'),
  card('people-nvren', 'people', '女人', 'nǚ rén', 'phụ nữ', 'HSK1', 5, 'people-ren'),
  // family — 家
  card('family-jia', 'family', '家', 'jiā', 'nhà - gia đình', 'HSK1', 0, null),
  card('family-dajia', 'family', '大家', 'dà jiā', 'mọi người', 'HSK1', 1, 'family-jia'),
  card('family-guojia', 'family', '国家', 'guó jiā', 'quốc gia', 'HSK1', 2, 'family-jia'),
  card('family-jiaren', 'family', '家人', 'jiā rén', 'người nhà', 'HSK1', 3, 'family-jia'),
  card('family-jiazhang', 'family', '家长', 'jiā zhǎng', 'phụ huynh', 'HSK1', 4, 'family-jia'),
  // study — 学
  card('study-xue', 'study', '学', 'xué', 'học', 'HSK2', 0, null),
  card('study-xuesheng', 'study', '学生', 'xué shēng', 'học sinh', 'HSK2', 1, 'study-xue'),
  card('study-xuexiao', 'study', '学校', 'xué xiào', 'trường học', 'HSK2', 2, 'study-xue'),
  card('study-tongxue', 'study', '同学', 'tóng xué', 'bạn học', 'HSK2', 3, 'study-xue'),
  card('study-xuexi', 'study', '学习', 'xué xí', 'học tập', 'HSK2', 4, 'study-xue'),
  // food — 吃
  card('food-chi', 'food', '吃', 'chī', 'ăn', 'HSK2', 0, null),
  card('food-chifan', 'food', '吃饭', 'chī fàn', 'ăn cơm', 'HSK2', 1, 'food-chi'),
  card('food-haochi', 'food', '好吃', 'hǎo chī', 'ngon', 'HSK2', 2, 'food-chi'),
  card('food-xiaochi', 'food', '小吃', 'xiǎo chī', 'đồ ăn vặt', 'HSK2', 3, 'food-chi'),
];

function card(
  id: string,
  deckId: string,
  character: string,
  pinyin: string,
  meaning: string | null,
  level: string,
  position: number,
  parentId: string | null,
): FakeCard {
  return { id, deckId, character, pinyin, meaning, level, position, parentId };
}

// ---- Truy vấn tiện ích trên fixtures ----

export function fakeDeckSummaries(level?: string) {
  return FAKE_DECKS.filter((d) => !level || d.level === level)
    .sort((a, b) => a.position - b.position)
    .map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      level: d.level,
      _count: { cards: FAKE_CARDS.filter((c) => c.deckId === d.id).length },
    }));
}

export function fakeDeckCards(deckId: string) {
  return FAKE_CARDS.filter((c) => c.deckId === deckId).sort(
    (a, b) => a.position - b.position,
  );
}

export function fakeWordTree(deckId: string) {
  const roots = FAKE_CARDS.filter((c) => c.deckId === deckId && c.parentId === null);
  return roots
    .sort((a, b) => a.position - b.position)
    .map((root) => ({
      ...root,
      children: FAKE_CARDS.filter((c) => c.parentId === root.id).sort(
        (a, b) => a.position - b.position,
      ),
    }));
}

export function fakeCard(id: string) {
  const c = FAKE_CARDS.find((x) => x.id === id);
  if (!c) return null;
  return { ...c, children: FAKE_CARDS.filter((x) => x.parentId === id) };
}
