import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import { generateNhiKhoaDocx } from '../utils/docxGeneratorNhiKhoa';
import { DROPDOWN_OPTIONS } from '../constants/options';
import { useWebSocket } from '../hooks/useWebSocket';
import ChatPanel from '../components/ChatPanel';
import { toDateTimeLocalValue } from '../utils/datetime';
import CLSDeNghiSection from '../components/CLSDeNghiSection';
import TuVanSection from '../components/TuVanSection';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const NhiKhoa = () => {
    // STATE DATA
    const [formData, setFormData] = useState({
        hoTen: '',
        gioiTinh: '',
        ngaySinh: '', // yyyy-mm-dd
        tuoi: '-', // auto calc
        danToc: '',
        hotenBoMe: '',
        ngheNghiep: '', // maybe 'Nghề nghiệp bố mẹ?' Old code just says 'nghenghiep'
        diaChi: '',
        tonGiao: '',
        benhVien: '',
        khoaPhongGiuong: '',
        lienHeNguoiThanTen: '',
        lienHeNguoiThanSdt: '',
        ngayVaoVien: toDateTimeLocalValue(),
        ngayLamBenhAn: toDateTimeLocalValue(),

        // Hỏi bệnh
        lyDo: '',
        benhSu: '',
        tienSu: '',

        // Tiền sử sản khoa đặc thù nhi
        conThu: '',
        paraCuaMe: '',
        quaTrinhMangThai: '',
        cachSanh: '',
        canNangLucSanh: '',
        chieuDaiLucSanh: '',
        vongDauLucSanh: '',
        apgarScore: '',
        tinhTrangLucSanh: '',

        // Nuôi dưỡng
        nuoiDuong: '',
        suaMe: '',
        suaCongThuc: '',
        thoiDiemAnDam: '',

        // Phát triển tâm thần vận động
        phatTrienVanDong: '',
        phatTrienTamThan: '',

        // Tiêm chủng
        tiemChung: '',

        // Khám bệnh
        khamLucVaoVien: '',
        toanThan: "- Bệnh nhi tỉnh, tiếp xúc tốt\n- Da niêm hồng, chi ấm, CRT < 2s\n- Không phù, không dấu xuất huyết dưới da\n- Tuyến giáp không to\n- Hạch ngoại vi không sờ chạm",
        mach: '',
        nhietDo: '',
        haTren: '',
        haDuoi: '',
        nhipTho: '',

        chieuCao: '',
        canNang: '',
        wa: '',
        ha: '',
        wh: '',
        bmiTuoi: '',

        // Co quan
        timmach: '',
        hohap: '',
        tieuhoa: '',
        than: '',
        thankinh: '',
        cokhop: '',
        taiMuiHong: '',
        rangHamMat: '',
        mat: '',
        coQuanKhac: 'Không phát hiện bất thường',

        // CLS
        clsDaLam: '', // wait, old code didn't map this in getFormData except generic logic? Check `main.js`. Yes, it did.

        // Ket luan
        tomTat: '',
        chanDoan: '',
        chanDoanPhanBiet: '',

        clsThuongQuy: 'CTM; TPTNT; glucose máu; định lượng AST, ALT, ure, creatinin huyết thanh; eGFR; ion đồ 3 thông số; ECG',
        clsChuanDoan: '',
        clsChanDoanPresets: [],
        clsTimNguyenNhanPresets: [],
        clsHoTroDieuTriPresets: [],
        clsTheoDoiTienLuongPresets: [],
        clsHoTroDieuTri: '',
        clsTheoDoiTienLuong: '',
        ketQua: '',

        chanDoanXacDinh: '',
        huongDieuTri: '',
        dieuTri: '',
        tienLuong: '',
        tuVanInDocx: true,
        tuVanPresets: [],
        tuVan: '',
        bienLuan: ''
    });

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [zScoreStatus, setZScoreStatus] = useState('');

    // Web Socket
    const { isEnabled, isConnected, onlineCount, locks, clientId, remoteData, sendState, lockField, unlockField } = useWebSocket('nhikhoa');

    // Sync remote data
    useEffect(() => {
        if (remoteData) {
            setFormData(prev => ({ ...prev, ...remoteData }));
        }
    }, [remoteData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => {
            const next = { ...prev, [name]: val };
            sendState(next);
            return next;
        });
    };

    const handleFocus = (e) => {
        lockField(e.target.name);
    };

    const handleBlur = (e) => {
        unlockField(e.target.name);
    };

    // Auto Calculate Age (Nhi Khoa precise logic)
    const calcAge = useCallback((dobStr) => {
        if (!dobStr) return { text: '-', years: null, months: null };
        const dob = new Date(dobStr);
        if (isNaN(dob.getTime())) return { text: '-', years: null, months: null };

        const now = new Date(); // In production old code used Asia/Ho_Chi_Minh logic, here we rely on client system time ~ acceptable
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        let days = now.getDate() - dob.getDate();

        if (days < 0) months -= 1;
        if (months < 0) {
            years -= 1;
            months += 12;
        }

        if (years < 0) return { text: 'Chưa sinh', years: 0, months: 0 };

        const text = (months > 0) ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
        return { text, years, months };
    }, []);

    useEffect(() => {
        const { text } = calcAge(formData.ngaySinh);
        if (text !== formData.tuoi) {
            setFormData(prev => ({ ...prev, tuoi: text }));
        }
    }, [formData.ngaySinh, calcAge, formData.tuoi]);

    // Z-SCORE CALL
    useEffect(() => {
        const h = parseFloat(formData.chieuCao);
        const w = parseFloat(formData.canNang);
        const { years, months } = calcAge(formData.ngaySinh);
        const gender = formData.gioiTinh;

        // Debounce logic is tricky in useEffect without extra libs or cleanup.
        // We will stick to a simple timeout.
        const handler = setTimeout(async () => {
            if (h > 0 && w > 0 && years !== null && gender) {
                setZScoreStatus('Đang tính toán...');
                try {
                    const payload = {
                        height_cm: h,
                        weight_kg: w,
                        age_years: years,
                        age_months: months,
                        age_total_months: (years * 12) + months,
                        gender
                    };

                    const systemPrompt = `Bạn là trợ lý y khoa. Nhiệm vụ: đánh giá 3 chỉ số Z-score theo WHO:
1) weight_for_age (cân nặng theo tuổi)
2) height_for_age (chiều cao theo tuổi)
3) weight_for_height (cân nặng theo chiều cao)
Trả về DUY NHẤT 1 JSON: {"weight_for_age": "...", "height_for_age": "...", "weight_for_height": "..."}`;

                    const res = await fetch(`${API_BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: JSON.stringify(payload) }
                            ]
                        })
                    });

                    if (res.status === 429) {
                        setZScoreStatus('Bị giới hạn 429, thử lại sau');
                        return;
                    }

                    const data = await res.json();
                    let json = {};
                    try {
                        json = JSON.parse(data.answer);
                    } catch {
                        // Fallback regex
                        const m = data.answer.match(/\{[\s\S]*\}/);
                        if (m) json = JSON.parse(m[0]);
                    }

                    if (json.weight_for_age) {
                        setFormData(prev => ({
                            ...prev,
                            wa: json.weight_for_age,
                            ha: json.height_for_age,
                            wh: json.weight_for_height
                        }));
                        setZScoreStatus('');
                    }
                } catch (e) {
                    console.error(e);
                    setZScoreStatus('Lỗi tính Z-score');
                }
            } else {
                // Clear if invalid
                if (zScoreStatus !== '') setZScoreStatus('');
            }
        }, 1000); // 1s debounce

        return () => clearTimeout(handler);
    }, [formData.chieuCao, formData.canNang, formData.ngaySinh, formData.gioiTinh, calcAge]); // zScoreStatus not dependency


    // AUTO SUMMARY
    useEffect(() => {
        // "Bệnh nhi [gioitinh] [tuoi]... vào viện vì lý do [lydo]. Qua hỏi bệnh, khám bệnh ghi nhận:"
        const gender = (formData.gioiTinh || '--').toLowerCase();
        const age = (formData.tuoi && formData.tuoi !== '-') ? formData.tuoi : '--';
        const reason = (formData.lyDo || '--');

        let head = `Bệnh nhi ${gender}`;
        if (age !== '--') head += ` ${age}`;
        head += `, vào viện vì lý do ${reason}.`;

        const summ = `${head} Qua hỏi bệnh, khám bệnh ghi nhận:`;

        if (summ !== formData.tomTat) {
            setFormData(prev => ({ ...prev, tomTat: summ }));
        }
    }, [formData.gioiTinh, formData.tuoi, formData.lyDo]);


    const handleDropdown = (name, targetField) => (e) => {
        const val = e.target.value;
        if (!val) return;
        setFormData(prev => ({ ...prev, [targetField]: val }));
    };

    const isLocked = (field) => locks[field] && locks[field].by !== clientId;

    return (
        <div className="page-container" style={{ position: 'relative' }}>
            {/* Toolbar */}
            <div className="glass" style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>Nhi Khoa</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isEnabled && (
                        <div style={{ fontSize: '0.8rem', marginRight: '1rem', color: isConnected ? 'green' : 'red' }}>
                            {isConnected ? `Online: ${onlineCount}` : 'Disconnected'}
                        </div>
                    )}
                    <button className="btn" onClick={() => setIsPreviewOpen(true)}>
                        Xem trước
                    </button>
                    <button className="btn btn-primary" onClick={() => generateNhiKhoaDocx(formData)}>
                        <SpriteIcon type="toolbar" idx={0} /> Xuất Word
                    </button>
                    <button className="btn glass" onClick={() => setIsChatOpen(true)}>
                        <SpriteIcon type="toolbar" idx={1} /> Chat
                    </button>
                    <button className="btn glass" onClick={() => setFormData({ ...formData, hoTen: '', ngaySinh: '' })}>
                        <SpriteIcon type="toolbar" idx={2} /> Reset
                    </button>
                </div>
            </div>

            <div className="grid-2">
                {/* A. HÀNH CHÍNH */}
                <FormSection title="A. Hành Chính">
                    <div className="input-group">
                        <label>1. Họ và tên</label>
                        <input name="hoTen" value={formData.hoTen} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} disabled={isLocked('hoTen')} />
                        {isLocked('hoTen') && <span className="text-xs text-red-500"><SpriteIcon type="misc" idx={2} size={12} /> Đang được sửa...</span>}
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>2. Giới tính</label>
                            <select name="gioiTinh" value={formData.gioiTinh} onChange={handleChange}>
                                <option value="">-- Chọn --</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>3. Sinh ngày</label>
                            <input name="ngaySinh" type="date" value={formData.ngaySinh} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Tuổi</label>
                        <div className="glass" style={{ padding: '0.75rem' }}>{formData.tuoi || '-'}</div>
                    </div>
                    <div className="input-group">
                        <label>4. Dân tộc</label>
                        <input name="danToc" value={formData.danToc} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>5. Họ tên bố/mẹ</label>
                        <input name="hotenBoMe" value={formData.hotenBoMe} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>6. Nghề nghiệp</label>
                        <input name="ngheNghiep" value={formData.ngheNghiep} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Tôn giáo</label>
                        <input name="tonGiao" value={formData.tonGiao} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>7. Địa chỉ</label>
                        <textarea name="diaChi" value={formData.diaChi} onChange={handleChange} rows={2} />
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Bệnh viện</label>
                            <input name="benhVien" value={formData.benhVien} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Khoa/Phòng/Giường</label>
                            <input name="khoaPhongGiuong" value={formData.khoaPhongGiuong} onChange={handleChange} placeholder="VD: Nhi - P.5 - G.03" />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Liên hệ người thân (tên)</label>
                            <input name="lienHeNguoiThanTen" value={formData.lienHeNguoiThanTen} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Liên hệ người thân (SĐT)</label>
                            <input name="lienHeNguoiThanSdt" value={formData.lienHeNguoiThanSdt} onChange={handleChange} inputMode="tel" placeholder="VD: 09xx..." />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>8. Ngày giờ vào viện</label>
                        <input name="ngayVaoVien" type="datetime-local" value={formData.ngayVaoVien} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Ngày giờ làm bệnh án</label>
                        <input name="ngayLamBenhAn" type="datetime-local" value={formData.ngayLamBenhAn} onChange={handleChange} />
                    </div>
                </FormSection>

                {/* B. BỆNH ÁN */}
                <FormSection title="B. Bệnh Án">
                    <div className="input-group">
                        <label>1. Lý do vào viện</label>
                        <textarea name="lyDo" value={formData.lyDo} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>2. Bệnh sử</label>
                        <textarea name="benhSu" value={formData.benhSu} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>3. Tiền sử</label>
                        <textarea name="tienSu" value={formData.tienSu} onChange={handleChange} rows={3} placeholder="Tiền sử bệnh lý..." />
                    </div>

                    {/* Tiền sử sản khoa + phát triển đặc thù nhi khoa */}
                    <div className="glass" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Tiền sử sản khoa</label>
                        <div className="grid-2" style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
                            <div>Con thứ: <input name="conThu" value={formData.conThu} onChange={handleChange} style={{ width: '60px' }} /></div>
                            <div>PARA mẹ: <input name="paraCuaMe" value={formData.paraCuaMe} onChange={handleChange} style={{ width: '80px' }} placeholder="0000" /></div>
                            <div>Cách sanh: <input name="cachSanh" value={formData.cachSanh} onChange={handleChange} placeholder="Thường/Mổ..." /></div>
                        </div>
                        <div className="grid-3" style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
                            <div>CN lúc sanh: <input name="canNangLucSanh" value={formData.canNangLucSanh} onChange={handleChange} style={{ width: '60px' }} /> g</div>
                            <div>Chiều dài: <input name="chieuDaiLucSanh" value={formData.chieuDaiLucSanh} onChange={handleChange} style={{ width: '60px' }} /> cm</div>
                            <div>Vòng đầu: <input name="vongDauLucSanh" value={formData.vongDauLucSanh} onChange={handleChange} style={{ width: '60px' }} /> cm</div>
                        </div>
                        <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                            <div>APGAR: <input name="apgarScore" value={formData.apgarScore} onChange={handleChange} style={{ width: '80px' }} placeholder="9/10" /></div>
                            <div>Tình trạng lúc sanh: <input name="tinhTrangLucSanh" value={formData.tinhTrangLucSanh} onChange={handleChange} placeholder="Khóc ngay..." /></div>
                        </div>
                        <textarea name="quaTrinhMangThai" value={formData.quaTrinhMangThai} onChange={handleChange} rows={2} placeholder="Quá trình mang thai của mẹ..." style={{ marginTop: '0.5rem' }} />
                    </div>

                    <div className="glass" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Nuôi dưỡng</label>
                        <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                            <div>Sữa mẹ hoàn toàn: <input name="suaMe" value={formData.suaMe} onChange={handleChange} placeholder="... tháng" /></div>
                            <div>Sữa công thức từ: <input name="suaCongThuc" value={formData.suaCongThuc} onChange={handleChange} placeholder="... tháng" /></div>
                            <div>Thời điểm ăn dặm: <input name="thoiDiemAnDam" value={formData.thoiDiemAnDam} onChange={handleChange} placeholder="... tháng" /></div>
                        </div>
                        <textarea name="nuoiDuong" value={formData.nuoiDuong} onChange={handleChange} rows={2} placeholder="Mô tả thêm..." style={{ marginTop: '0.5rem' }} />
                    </div>

                    <div className="glass" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Phát triển tâm thần vận động</label>
                        <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                            <div><label className="text-sm">Vận động</label><input name="phatTrienVanDong" value={formData.phatTrienVanDong} onChange={handleChange} placeholder="Lật, bò, đi..." /></div>
                            <div><label className="text-sm">Tâm thần</label><input name="phatTrienTamThan" value={formData.phatTrienTamThan} onChange={handleChange} placeholder="Nói, hiểu..." /></div>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Tiêm chủng</label>
                        <textarea name="tiemChung" value={formData.tiemChung} onChange={handleChange} rows={2} placeholder="Tiêm chủng đầy đủ theo chương trình TCMR..." style={{ marginTop: '0.5rem' }} />
                    </div>
                </FormSection>
            </div>

            {/* KHÁM LÂM SÀNG */}
            <FormSection title="II. Khám Bệnh" className="mt-4" style={{ marginTop: '1rem' }}>
                <div className="input-group">
                    <label>Khám lúc vào viện</label>
                    <textarea
                        name="khamLucVaoVien"
                        value={formData.khamLucVaoVien}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Nhập tóm tắt ngắn gọn..."
                    />
                </div>
                <div className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Khám hiện tại</div>
                    <div className="grid-3" style={{ marginBottom: '1rem' }}>
                        <div>Mạch: <input name="mach" value={formData.mach} onChange={handleChange} style={{ width: '60px' }} /> l/p</div>
                        <div>Nhiệt: <input name="nhietDo" value={formData.nhietDo} onChange={handleChange} style={{ width: '60px' }} /> °C</div>
                        <div>HA: <input name="haTren" value={formData.haTren} onChange={handleChange} style={{ width: '50px' }} placeholder="90" />/<input name="haDuoi" value={formData.haDuoi} onChange={handleChange} style={{ width: '50px' }} placeholder="60" /> mmHg</div>
                        <div>Nhịp thở: <input name="nhipTho" value={formData.nhipTho} onChange={handleChange} style={{ width: '60px' }} /> l/p</div>
                    </div>
                    <div className="grid-2">
                        <div>Cao: <input name="chieuCao" value={formData.chieuCao} onChange={handleChange} style={{ width: '60px' }} /> cm</div>
                        <div>Nặng: <input name="canNang" value={formData.canNang} onChange={handleChange} style={{ width: '60px' }} /> kg</div>
                    </div>
                    {/* Z-SCORE DISPLAY */}
                    <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <SpriteIcon type="clinical" idx={0} size={16} /> Đánh giá Z-score (AI): <span style={{ fontWeight: 'normal', fontSize: '0.9em' }}>{zScoreStatus}</span>
                        </div>
                        <div className="grid-3" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            <div>CN/Tuổi: <b>{formData.wa || '-'}</b></div>
                            <div>CC/Tuổi: <b>{formData.ha || '-'}</b></div>
                            <div>CN/CC: <b>{formData.wh || '-'}</b></div>
                        </div>
                    </div>
                </div>

                <div className="input-group">
                    <label>1. Toàn trạng</label>
                    <textarea name="toanThan" value={formData.toanThan} onChange={handleChange} rows={3} />
                </div>

                <div className="grid-2">
                    <div className="input-group">
                        <label>2a) Tuần hoàn</label>
                        <select onChange={handleDropdown('timmach', 'timmach')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.timmach.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="timmach" value={formData.timmach} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>2b) Hô hấp</label>
                        <select onChange={handleDropdown('hohap', 'hohap')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.hohap.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="hohap" value={formData.hohap} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>2c) Tiêu hoá</label>
                        <select onChange={handleDropdown('tieuhoa', 'tieuhoa')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.tieuhoa.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="tieuhoa" value={formData.tieuhoa} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>2d) Thận - Tiết niệu</label>
                        <select onChange={handleDropdown('than', 'than')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.than.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="than" value={formData.than} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>2e) Thần kinh</label>
                        <select onChange={handleDropdown('thankinh', 'thankinh')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.thankinh.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="thankinh" value={formData.thankinh} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>2f) Cơ xương khớp</label>
                        <select onChange={handleDropdown('cokhop', 'cokhop')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.cokhop.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="cokhop" value={formData.cokhop} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>2g) Khác</label>
                        <textarea name="coQuanKhac" value={formData.coQuanKhac} onChange={handleChange} rows={3} />
                    </div>
                </div>
            </FormSection>

            {/* KẾT LUẬN */}
            <FormSection title="III. Kết Luận" className="mt-4" style={{ marginTop: '1rem' }}>
                <div className="input-group">
                    <label>1. Tóm tắt</label>
                    <textarea name="tomTat" value={formData.tomTat} onChange={handleChange} rows={4} />
                </div>
                <div className="input-group">
                    <label>2. Chẩn đoán sơ bộ</label>
                    <textarea name="chanDoan" value={formData.chanDoan} onChange={handleChange} rows={2} />
                </div>
                <div className="input-group">
                    <label>3. Chẩn đoán phân biệt</label>
                    <textarea name="chanDoanPhanBiet" value={formData.chanDoanPhanBiet} onChange={handleChange} rows={2} />
                </div>
                <div className="input-group">
                    <label>4. Đề nghị CLS</label>
                    <CLSDeNghiSection formData={formData} setFormData={setFormData} sendState={sendState} />
                </div>
                <div className="input-group">
                    <label>Kết quả</label>
                    <textarea name="ketQua" value={formData.ketQua} onChange={handleChange} rows={2} />
                </div>
                <div className="input-group">
                    <label>5. Chẩn đoán xác định</label>
                    <textarea name="chanDoanXacDinh" value={formData.chanDoanXacDinh} onChange={handleChange} rows={2} />
                </div>
                <div className="input-group">
                    <label>6. Điều trị</label>
                    <label className="text-sm mt-2">Hướng điều trị</label>
                    <textarea name="huongDieuTri" value={formData.huongDieuTri} onChange={handleChange} rows={2} />
                    <label className="text-sm mt-2">Cụ thể</label>
                    <textarea name="dieuTri" value={formData.dieuTri} onChange={handleChange} rows={4} />
                </div>
                <div className="input-group">
                    <label>7. Tiên lượng</label>
                    <textarea name="tienLuong" value={formData.tienLuong} onChange={handleChange} rows={3} />
                </div>
            </FormSection>

            <FormSection title="IV. Tư vấn" className="mt-4" style={{ marginTop: '1rem' }}>
                <TuVanSection formData={formData} setFormData={setFormData} sendState={sendState} />
            </FormSection>

            {/* Biện luận */}
            <FormSection title="C. Biện Luận" className="mt-4" style={{ marginTop: '1rem' }}>
                <textarea name="bienLuan" value={formData.bienLuan} onChange={handleChange} rows={5} />
            </FormSection>

            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                formData={formData}
                setFormData={setFormData}
                formType="nhikhoa"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="nhikhoa"
                onExport={() => generateNhiKhoaDocx(formData)}
            />
        </div>
    );
};

export default NhiKhoa;
