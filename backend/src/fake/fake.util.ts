/**
 * Cờ bật fake data. MẶC ĐỊNH BẬT (true) để FE chạy khi chưa có DB.
 * Khi đã seed dữ liệu thật vào MySQL → đặt USE_FAKE_DATA=false trong .env.
 */
export function isFakeData(): boolean {
  return process.env.USE_FAKE_DATA !== 'false';
}
