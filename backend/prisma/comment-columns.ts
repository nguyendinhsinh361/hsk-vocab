/**
 * Đẩy comment giải thích xuống từng cột MySQL (hiện ở cột `comment` trong TablePlus).
 * Prisma không quản lý column comment nên chạy script này SAU mỗi lần `prisma migrate`.
 *
 *   pnpm run db:comments
 *
 * An toàn: lấy nguyên định nghĩa cột từ SHOW CREATE TABLE rồi chỉ gắn thêm COMMENT,
 * không đụng tới kiểu dữ liệu / default / nullability.
 */
import 'dotenv/config';
import mariadb from 'mariadb';

/* Bản đồ comment: "Table.column" → mô tả (đồng bộ với /// trong schema.prisma). */
const COMMENTS: Record<string, string> = {
  // Topic
  'Topic.id': 'Khoá chính (id chủ đề, vd t-hsk1-giadinh)',
  'Topic.hskLevel': 'Cấp HSK của chủ đề (suy từ tên thư mục data khi seed)',
  'Topic.order': 'Thứ tự hiển thị chủ đề trong cấp HSK',
  'Topic.title': 'Tên chủ đề đa ngữ, JSON { vi, en }',
  'Topic.groupType': 'Loại nhóm (hiện chỉ topic_group)',
  'Topic.estimatedMinutes': 'Thời lượng học ước tính (phút)',

  // Word
  'Word.id': 'Khoá chính (id từ, vd w-mama)',
  'Word.hz': 'Chữ Hán (hanzi), vd 妈妈',
  'Word.py': 'Phiên âm pinyin, vd māma',
  'Word.hv': 'Âm Hán-Việt',
  'Word.pos': 'Từ loại; rỗng trong CSV → UNKNOWN',
  'Word.meaning': 'Nghĩa đa ngữ, JSON { vi, en } (= cột mn trong CSV)',
  'Word.audioUrl': 'Đường dẫn file audio phát âm (nếu có)',
  'Word.mw': 'Lượng từ (measure word) đi kèm, nếu có',
  'Word.exSample': 'Câu ví dụ (chữ Hán)',
  'Word.exPinyin': 'Pinyin của câu ví dụ',
  'Word.exMeaning': 'Nghĩa câu ví dụ đa ngữ, JSON { vi, en }',
  'Word.hskLevel': 'Cấp HSK của từ',
  'Word.hanVietLevel': 'Mức độ Hán-Việt (M1 dễ → M3 khó)',
  'Word.isPublished': 'Đã publish (hiển thị cho người học) hay chưa',
  'Word.createdAt': 'Thời điểm tạo bản ghi',

  // Root
  'Root.id': 'Khoá chính (id gốc, vd r-shang)',
  'Root.hz': 'Chữ Hán của gốc, vd 上',
  'Root.py': 'Pinyin của gốc',
  'Root.hv': 'Âm Hán-Việt của gốc',
  'Root.hskLevel': 'Cấp HSK của gốc',
  'Root.topicId': 'Chủ đề chứa gốc (tuỳ chọn); FK Topic, xoá topic → NULL',

  // RootPattern
  'RootPattern.id': 'Khoá chính (id pattern; seed sinh dạng "<rootId>::<idx>")',
  'RootPattern.rootId': 'Gốc từ chứa pattern này (FK Root)',
  'RootPattern.formula': 'Công thức ghép, vd "上+___" hoặc "___+上"',
  'RootPattern.meaning': 'Nghĩa của pattern',
  'RootPattern.order': 'Thứ tự pattern trong gốc',

  // PatternWord
  'PatternWord.patternId': 'FK RootPattern (pattern chứa từ)',
  'PatternWord.wordId': 'FK Word (từ minh hoạ cho pattern)',
  'PatternWord.order': 'Thứ tự từ trong pattern',

  // TopicWord
  'TopicWord.topicId': 'FK Topic',
  'TopicWord.wordId': 'FK Word',
  'TopicWord.order': 'Thứ tự từ trong chủ đề',

  // WordRoot
  'WordRoot.wordId': 'FK Word',
  'WordRoot.rootId': 'FK Root',
  'WordRoot.order': 'Thứ tự gốc trong từ',

  // Exercise
  'Exercise.id': 'Khoá chính (CSV không có id → cuid())',
  'Exercise.topicId': 'Chủ đề của câu hỏi (tuỳ chọn); FK Topic',
  'Exercise.rootId': 'Gốc từ liên quan (tuỳ chọn, chủ yếu nhóm D); FK Root',
  'Exercise.wordId': 'Từ vựng câu hỏi xoay quanh (bắt buộc); FK Word',
  'Exercise.type': 'Dạng câu hỏi cụ thể (A1..D3)',
  'Exercise.group': 'Nhóm kỹ năng (A nhận biết, B tái tạo, C ngữ cảnh, D gốc từ)',
  'Exercise.title': 'Tiêu đề dạng bài đa ngữ, JSON { vi, en }',
  'Exercise.question': 'Đề bài đa ngữ, JSON { vi, en }',
  'Exercise.answers': 'Các phương án trả lời đa ngữ, JSON { vi: [...] }',
  'Exercise.correctAnswer': 'Đáp án đúng đa ngữ, JSON { vi }',
  'Exercise.explanation': 'Giải thích đáp án đa ngữ, JSON { vi } (tuỳ chọn)',
  'Exercise.audioScript': 'Kịch bản audio cho dạng nghe (A2…), nếu có',
  'Exercise.imageDescription': 'Mô tả ảnh cho dạng nhìn ảnh (B2), nếu có',
  'Exercise.hskLevel': 'Cấp HSK của câu hỏi',
  'Exercise.order': 'Thứ tự câu hỏi',

  // User
  'User.id': 'Khoá chính',
  'User.email': 'Email đăng nhập (duy nhất)',
  'User.name': 'Tên hiển thị',
  'User.avatar': 'Ảnh đại diện (URL), nếu có',
  'User.xp': 'Điểm kinh nghiệm tích luỹ',
  'User.level': 'Cấp độ người dùng (tính từ XP)',
  'User.streak': 'Chuỗi ngày học liên tiếp',
  'User.lastActiveDate': 'Ngày hoạt động gần nhất (dùng tính streak)',
  'User.createdAt': 'Thời điểm tạo tài khoản',
  'User.updatedAt': 'Thời điểm cập nhật gần nhất',

  // UserWordProgress
  'UserWordProgress.id': 'Khoá chính',
  'UserWordProgress.userId': 'FK User',
  'UserWordProgress.wordId': 'FK Word',
  'UserWordProgress.mastery': 'Mức thành thạo (NEW → MASTERED)',
  'UserWordProgress.correctCount': 'Số lần trả lời đúng',
  'UserWordProgress.seenCount': 'Số lần từ này xuất hiện',
  'UserWordProgress.lastSeenAt': 'Lần gặp gần nhất',

  // PracticeSession
  'PracticeSession.id': 'Khoá chính',
  'PracticeSession.userId': 'FK User',
  'PracticeSession.topicId': 'Chủ đề luyện tập (tuỳ chọn)',
  'PracticeSession.total': 'Tổng số câu trong phiên',
  'PracticeSession.correctCount': 'Số câu trả lời đúng',
  'PracticeSession.xpEarned': 'XP kiếm được trong phiên',
  'PracticeSession.completedAt': 'Thời điểm hoàn thành phiên (NULL nếu chưa xong)',
  'PracticeSession.createdAt': 'Thời điểm bắt đầu phiên',

  // PracticeAnswer
  'PracticeAnswer.id': 'Khoá chính',
  'PracticeAnswer.sessionId': 'FK PracticeSession',
  'PracticeAnswer.exerciseId': 'FK Exercise (câu hỏi đã trả lời)',
  'PracticeAnswer.isCorrect': 'Trả lời đúng hay sai',
  'PracticeAnswer.createdAt': 'Thời điểm trả lời',
};

const url = new URL(process.env.DATABASE_URL || 'mysql://root@localhost:3306/migii_hsk');
const DB = url.pathname.replace(/^\//, '');

/* Escape chuỗi cho literal MySQL. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/* Lấy định nghĩa từng cột từ SHOW CREATE TABLE, bỏ COMMENT cũ nếu có. */
function parseColumns(createSql: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of createSql.split('\n')) {
    const line = raw.trim().replace(/,$/, '');
    if (!line.startsWith('`')) continue; // bỏ dòng KEY/PRIMARY/CONSTRAINT/UNIQUE…
    const m = line.match(/^`([^`]+)`\s+(.*)$/);
    if (!m) continue;
    const col = m[1];
    // cắt COMMENT '...' ở cuối (nếu đã có)
    const def = m[2].replace(/\s+COMMENT\s+'(?:[^'\\]|\\.)*'\s*$/i, '');
    out[col] = def;
  }
  return out;
}

async function main() {
  const conn = await mariadb.createConnection({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: DB,
  });

  // Nhóm comment theo bảng
  const byTable = new Map<string, Array<[string, string]>>();
  for (const [key, text] of Object.entries(COMMENTS)) {
    const [table, col] = key.split('.');
    if (!byTable.has(table)) byTable.set(table, []);
    byTable.get(table)!.push([col, text]);
  }

  let applied = 0;
  let missing = 0;
  for (const [table, cols] of byTable) {
    let createSql: string;
    try {
      const rows: any[] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      createSql = rows[0]['Create Table'] || rows[0]['Create View'];
    } catch {
      console.warn(`  ⚠ bỏ qua bảng ${table} (chưa tồn tại — đã migrate chưa?)`);
      continue;
    }
    const defs = parseColumns(createSql);
    for (const [col, text] of cols) {
      const def = defs[col];
      if (!def) {
        console.warn(`  ⚠ ${table}.${col} không thấy trong DB`);
        missing++;
        continue;
      }
      const sql = `ALTER TABLE \`${table}\` MODIFY COLUMN \`${col}\` ${def} COMMENT '${esc(text)}'`;
      await conn.query(sql);
      applied++;
    }
    console.log(`  [${table}] gắn comment ${cols.length} cột`);
  }

  await conn.end();
  console.log(`Xong. Đã gắn ${applied} comment${missing ? `, thiếu ${missing} cột` : ''}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
