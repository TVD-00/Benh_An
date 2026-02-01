// Tiện ích xử lý ngày giờ cho input type="datetime-local"

/**
 * Trả về chuỗi phù hợp cho <input type="datetime-local"/>
 * Lưu ý: datetime-local không chứa timezone, nên cần chuyển về "local" trước khi toISOString().
 */
export function toDateTimeLocalValue(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const tzOffsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}
