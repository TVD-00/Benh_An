import React, { useState, useEffect } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import { generateDocx } from '../utils/docxGenerator';
import { DROPDOWN_OPTIONS } from '../constants/options';
import { useWebSocket } from '../hooks/useWebSocket';
import ChatPanel from '../components/ChatPanel';
import { toDateTimeLocalValue } from '../utils/datetime';
import CLSDeNghiSection from '../components/CLSDeNghiSection';
import TuVanSection from '../components/TuVanSection';

const formatDDMMYYYY = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
};

const SanKhoa = () => {
    // STATE DATA
    const [formData, setFormData] = useState({
        hoTen: '',
        namSinh: '',
        tuoi: '',
        ngheNghiep: '',
        diaChi: '',
        tonGiao: '',
        benhVien: '',
        khoaPhongGiuong: '',
        lienHeNguoiThanTen: '',
        lienHeNguoiThanSdt: '',
        ngayVaoVien: toDateTimeLocalValue(),
        ngayLamBenhAn: toDateTimeLocalValue(),

        // Tiền sử
        para: '0000',
        danToc: '',
        tienSu: "a) Bản thân:\n  - Sản khoa: \n    + Kinh cuối: Quên\n    + Lấy chồng năm 24 tuổi\n    + PARA: 1001 (sinh thường không biến chứng, 37 tuần, CNLS 3100g, hậu sản ổn)\n  - Phụ khoa:\n    + Kinh đầu năm 13 tuổi, chu kỳ đều 30 ngày, hành kinh 5 ngày, lượng 4-5 BVS/ngày đầu và giảm dần qua các ngày, máu đỏ sậm lẫn máu cục, không thống kinh.\n    + Không mắc bệnh phụ khoa\n    + Kế hoạch hóa gia đình: Không\n  - Nội khoa: Không THA, ĐTĐ2\n  - Ngoại khoa: Chưa từng phẫu thuật\n  - Thói quen: Không thuốc lá rượu bia\n  - Không tiền sử dị ứng thuốc, thức ăn\nb) Gia đình: Không ghi nhận bệnh lý liên quan",
        tienSuSanKhoa: '',

        // Bệnh sử
        lyDo: '',
        benhSuNhapVien: '',

        // Khám lúc vào viện
        khamLucVaoVien: '',

        // Kham Thai (TCN)
        tcn1_on: true,
        tcn2_on: true,
        tcn3_on: true,
        tcn2_ogtt_on: false,

        tcn1_sa1_date: '',
        tcn1_sa1_x: '',
        tcn1_sa1_y: '',
        tcn1_sa1_crl: '',
        tcn1_text: "- Khám không ghi nhận bất thường\n- CTM, TPTNT không phát hiện bất thường\n- Nhóm máu:\n- HIV (-), HbsAg (-), Rubella IgM + IgG (-), CMV (-), VDRL (-)\n- Combitest: Nguy cơ thấp\n- Tầm soát TSG: Nguy cơ thấp",
        tcn2_text: "- Thai máy từ tuần 20, tăng 4kg\n- Siêu âm 4D không ghi nhận bất thường\n- Tiêm 2 mũi VAT",
        tcn2_ogtt: '',
        tcn3_text: "- GBS (-)\n- Thai máy tốt\n- Sản phụ ăn uống được, tăng 7kg, tổng tăng 11kg\n- Siêu âm không bất thường nhau, ối\n- BMI trước khi mang thai:",

        khamThaiComputed: '',

        // Khám
        toanThan: "- Bệnh tỉnh, tiếp xúc tốt\n- Da niêm hồng, chi ấm, mạch rõ\n- Không phù, không dấu xuất huyết\n- Tuyến giáp không to\n- Hạch ngoại vi không sờ chạm",
        mach: '',
        haTren: '',
        haDuoi: '',
        nhietDo: '',
        nhipTho: '',
        canNang: '',
        chieuCao: '',
        bmi: '',
        phanLoaiBMI: '',

        // Co quan
        timmach: '',
        hohap: '',
        tieuhoa: '',
        than: '',
        thankinh: '',
        cokhop: '',
        coQuanKhac: 'Không phát hiện bất thường',

        // Chuyen khoa
        khamChuyenKhoa: "a) Khám ngoài:\n- Vú: 2 bên cân đối, núm vú không tụt, không sang thương hay chảy dịch\n- Bụng: TC hình trứng, trục dọc, BCTC 32cm, chu vi VB 100cm => Cân thai: 3300g\n- Leopold: Ngôi đầu, thế trái, chưa lọt\n- Tim thai 140 l/p (vị trí 1/4 dưới trái), cơn gò 2 cơn/10 phút, mỗi cơn 1 phút\nb) Khám trong:\n- Âm hộ bình thường. TSM chắc, không có sẹo cũ. Âm đạo niêm mạc trơn láng, đọng dịch nhầy\n- CTC: trơn láng, mật độ chắc, hướng trung gian, mở 3cm, xóa 60%\n- Tình trạng ối: phồng/dẹt, chưa vỡ/vỡ (? giờ)\n- Khung chậu: Sờ được 1/2 gờ vô danh không sờ được mỏm nhô, gai hông tù, khoảng cách 2 ụ ngồi bình thường\n=> Khung chậu bình thường trên lâm sàng\n- Đột lọt: -2\n- Bishop: 7 điểm",

        // CLS
        clsDaLam: '',

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
        tienLuong: "Tiên lượng sinh ngã âm đạo theo 3P:\n- Power:\n- Passenger:\n- Passage:",
        huongDieuTri: '',
        dieuTri: '',
        tuVanInDocx: true,
        tuVanPresets: [],
        tuVan: '',
        bienLuan: ''
    });

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Web Socket
    const { isEnabled, isConnected, onlineCount, locks, clientId, remoteData, sendState, lockField, unlockField } = useWebSocket('sankhoa');

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

    // Auto Calculate Age
    useEffect(() => {
        if (formData.namSinh) {
            const year = parseInt(formData.namSinh);
            const currentYear = new Date().getFullYear();
            if (!isNaN(year) && year > 1900 && year <= currentYear) {
                setFormData(prev => ({ ...prev, tuoi: currentYear - year }));
            }
        }
    }, [formData.namSinh]);

    // Auto Calculate BMI
    useEffect(() => {
        if (formData.canNang && formData.chieuCao) {
            const h = parseFloat(formData.chieuCao) / 100;
            const w = parseFloat(formData.canNang);
            if (h > 0 && w > 0) {
                const bmi = (w / (h * h)).toFixed(1);
                let pl = "";
                if (bmi < 18.5) pl = "gầy";
                else if (bmi < 23) pl = "trung bình";
                else if (bmi < 25) pl = "thừa cân";
                else if (bmi < 27.5) pl = "tiền béo phì";
                else if (bmi < 30) pl = "béo phì độ I";
                else pl = "béo phì độ II";

                setFormData(prev => ({ ...prev, bmi, phanLoaiBMI: pl }));
            }
        }
    }, [formData.canNang, formData.chieuCao]);

    // COMPUTED KHAM THAI + DU SINH
    useEffect(() => {
        const d0 = formData.tcn1_sa1_date ? new Date(formData.tcn1_sa1_date) : null;
        const x = parseInt(formData.tcn1_sa1_x);
        const y = parseInt(formData.tcn1_sa1_y);
        let dueStr = '';

        if (d0 && !isNaN(x) && !isNaN(y) && !isNaN(d0.getTime())) {
            const gaDays = (x * 7) + y;
            const due = new Date(d0.getTime());
            due.setDate(due.getDate() + (280 - gaDays));
            dueStr = formatDDMMYYYY(due);
        }

        const blocks = [];
        if (formData.tcn1_on) {
            let saLine = `- Siêu âm 1`;
            if (d0 && !isNaN(d0.getTime())) saLine += ` (${formatDDMMYYYY(d0)}):`;
            if (!isNaN(x) && !isNaN(y)) saLine += ` Ghi nhận thai ${x} tuần ${y} ngày,`;
            if (formData.tcn1_sa1_crl) saLine += ` CRL: ${formData.tcn1_sa1_crl} mm`;
            if (dueStr) saLine += ` => Dự sinh: ${dueStr}`;

            blocks.push(`TCN1\n${saLine}\n${formData.tcn1_text || ''}`);
        }
        if (formData.tcn2_on) {
            let block = `TCN2\n${formData.tcn2_text || ''}`;
            if (formData.tcn2_ogtt_on && formData.tcn2_ogtt) {
                block += `\n- OGTT: ${formData.tcn2_ogtt}`;
            }
            blocks.push(block);
        }
        if (formData.tcn3_on) {
            blocks.push(`TCN3\n${formData.tcn3_text || ''}`);
        }

        const final = blocks.join('\n\n');
        if (final !== formData.khamThaiComputed) {
            setFormData(prev => ({ ...prev, khamThaiComputed: final }));
        }

    }, [formData.tcn1_on, formData.tcn2_on, formData.tcn3_on, formData.tcn2_ogtt_on, formData.tcn1_sa1_date, formData.tcn1_sa1_x, formData.tcn1_sa1_y, formData.tcn1_sa1_crl, formData.tcn1_text, formData.tcn2_text, formData.tcn2_ogtt, formData.tcn3_text]);

    // AUTO SUMMARY
    useEffect(() => {
        if (!formData.khamThaiComputed) return;

        const d0 = formData.tcn1_sa1_date ? new Date(formData.tcn1_sa1_date) : null;
        const x = parseInt(formData.tcn1_sa1_x);
        const y = parseInt(formData.tcn1_sa1_y);
        let dueStr = '..../..../....';
        if (d0 && !isNaN(x) && !isNaN(y)) {
            const gaDays = (x * 7) + y;
            const due = new Date(d0.getTime());
            due.setDate(due.getDate() + (280 - gaDays));
            dueStr = formatDDMMYYYY(due);
        }

        const ageText = (formData.tuoi && formData.tuoi !== '-') ? `${formData.tuoi} tuổi` : '... tuổi';
        const paraText = formData.para || '....';
        const reasonText = formData.lyDo || '...';

        const summ = `Sản phụ ${ageText}, PARA ${paraText}, vào viện vì lý do ${reasonText}, dự sinh ${dueStr}. Qua hỏi bệnh, khám bệnh ghi nhận:`;

        if (summ !== formData.tomTat) {
            setFormData(prev => ({ ...prev, tomTat: summ }));
        }
    }, [formData.tuoi, formData.para, formData.lyDo, formData.khamThaiComputed]);


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
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>Sản Khoa</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isEnabled && (
                        <div style={{ fontSize: '0.8rem', marginRight: '1rem', color: isConnected ? 'green' : 'red' }}>
                            {isConnected ? `Online: ${onlineCount}` : 'Disconnected'}
                        </div>
                    )}
                    <button className="btn" onClick={() => setIsPreviewOpen(true)}>
                        Xem trước
                    </button>
                    <button className="btn btn-primary" onClick={() => generateDocx(formData)}>
                        <SpriteIcon type="toolbar" idx={0} /> Xuất Word
                    </button>
                    <button className="btn glass" onClick={() => setIsChatOpen(true)}>
                        <SpriteIcon type="toolbar" idx={1} /> Chat
                    </button>
                    <button className="btn glass" onClick={() => setFormData({ ...formData, hoTen: '', namSinh: '' })}>
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
                            <label>2. Năm sinh</label>
                            <input name="namSinh" type="number" value={formData.namSinh} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Tuổi</label>
                            <div className="glass" style={{ padding: '0.75rem' }}>{formData.tuoi || '-'}</div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>3. PARA</label>
                        <input name="para" value={formData.para} onChange={handleChange} placeholder="0000" />
                    </div>
                    <div className="input-group">
                        <label>4. Dân tộc</label>
                        <input name="danToc" value={formData.danToc} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>5. Nghề nghiệp</label>
                        <input name="ngheNghiep" value={formData.ngheNghiep} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Tôn giáo</label>
                        <input name="tonGiao" value={formData.tonGiao} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>6. Địa chỉ</label>
                        <textarea name="diaChi" value={formData.diaChi} onChange={handleChange} rows={2} />
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Bệnh viện</label>
                            <input name="benhVien" value={formData.benhVien} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Khoa/Phòng/Giường</label>
                            <input name="khoaPhongGiuong" value={formData.khoaPhongGiuong} onChange={handleChange} placeholder="VD: Sản - P.2 - G.08" />
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
                        <label>7. Ngày giờ vào viện</label>
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
                        <label>2. Tiền sử</label>
                        <textarea name="tienSu" value={formData.tienSu} onChange={handleChange} rows={6} />
                    </div>
                    <div className="input-group">
                        <label>3. Bệnh sử</label>
                        <textarea name="benhSuNhapVien" value={formData.benhSuNhapVien} onChange={handleChange} rows={3} placeholder="Quá trình nhập viện..." />
                    </div>

                    {/* QUÁ TRÌNH KHÁM THAI */}
                    <div className="glass" style={{ padding: '1rem', marginTop: '1rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Quá trình khám thai</label>

                        {/* TCN 1 */}
                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" name="tcn1_on" checked={formData.tcn1_on} onChange={handleChange} /> TCN1
                            </label>
                            {formData.tcn1_on && (
                                <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', marginLeft: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span>- SA1:</span>
                                        <input type="date" name="tcn1_sa1_date" value={formData.tcn1_sa1_date} onChange={handleChange} style={{ width: '130px' }} />
                                        <span>Thai</span>
                                        <input type="number" name="tcn1_sa1_x" value={formData.tcn1_sa1_x} onChange={handleChange} style={{ width: '50px' }} placeholder="w" />
                                        <span>tuần</span>
                                        <input type="number" name="tcn1_sa1_y" value={formData.tcn1_sa1_y} onChange={handleChange} style={{ width: '50px' }} placeholder="d" />
                                        <span>ngày, CRL</span>
                                        <input type="number" name="tcn1_sa1_crl" value={formData.tcn1_sa1_crl} onChange={handleChange} style={{ width: '60px' }} placeholder="mm" />
                                    </div>
                                    <textarea name="tcn1_text" value={formData.tcn1_text} onChange={handleChange} rows={3} />
                                </div>
                            )}
                        </div>

                        {/* TCN 2 */}
                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" name="tcn2_on" checked={formData.tcn2_on} onChange={handleChange} /> TCN2
                            </label>
                            {formData.tcn2_on && (
                                <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', marginLeft: '0.5rem' }}>
                                    <textarea name="tcn2_text" value={formData.tcn2_text} onChange={handleChange} rows={3} />
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="checkbox" name="tcn2_ogtt_on" checked={formData.tcn2_ogtt_on} onChange={handleChange} /> OGTT
                                        </label>
                                        <input name="tcn2_ogtt" value={formData.tcn2_ogtt} onChange={handleChange} disabled={!formData.tcn2_ogtt_on} placeholder="Kết quả OGTT..." />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TCN 3 */}
                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" name="tcn3_on" checked={formData.tcn3_on} onChange={handleChange} /> TCN3
                            </label>
                            {formData.tcn3_on && (
                                <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', marginLeft: '0.5rem' }}>
                                    <textarea name="tcn3_text" value={formData.tcn3_text} onChange={handleChange} rows={3} />
                                </div>
                            )}
                        </div>
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
                        <div>HA: <input name="haTren" value={formData.haTren} onChange={handleChange} style={{ width: '50px' }} placeholder="120" />/<input name="haDuoi" value={formData.haDuoi} onChange={handleChange} style={{ width: '50px' }} placeholder="80" /> mmHg</div>
                        <div>Nhịp thở: <input name="nhipTho" value={formData.nhipTho} onChange={handleChange} style={{ width: '60px' }} /> l/p</div>
                    </div>
                    <div className="grid-3">
                        <div>Cao: <input name="chieuCao" value={formData.chieuCao} onChange={handleChange} style={{ width: '60px' }} /> cm</div>
                        <div>Nặng: <input name="canNang" value={formData.canNang} onChange={handleChange} style={{ width: '60px' }} /> kg</div>
                        <div>BMI: <b>{formData.bmi || '-'}</b> ({formData.phanLoaiBMI || '-'})</div>
                    </div>
                </div>

                <div className="input-group">
                    <label>1. Toàn trạng</label>
                    <textarea name="toanThan" value={formData.toanThan} onChange={handleChange} rows={3} />
                </div>

                <div className="grid-2">
                    <div className="input-group">
                        <label>a) Tuần hoàn</label>
                        <select onChange={handleDropdown('timmach', 'timmach')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.timmach.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="timmach" value={formData.timmach} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>b) Hô hấp</label>
                        <select onChange={handleDropdown('hohap', 'hohap')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.hohap.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="hohap" value={formData.hohap} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>c) Tiêu hoá</label>
                        <select onChange={handleDropdown('tieuhoa', 'tieuhoa')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.tieuhoa.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="tieuhoa" value={formData.tieuhoa} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>d) Thận - Tiết niệu</label>
                        <select onChange={handleDropdown('than', 'than')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.than.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="than" value={formData.than} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>e) Thần kinh</label>
                        <select onChange={handleDropdown('thankinh', 'thankinh')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.thankinh.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="thankinh" value={formData.thankinh} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>f) Cơ xương khớp</label>
                        <select onChange={handleDropdown('cokhop', 'cokhop')}>
                            <option value="">-- Chọn --</option>
                            {DROPDOWN_OPTIONS.cokhop.map((opt, i) => <option key={i} value={opt}>{opt.substring(0, 40)}...</option>)}
                        </select>
                        <textarea name="cokhop" value={formData.cokhop} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>g) Khác</label>
                        <textarea name="coQuanKhac" value={formData.coQuanKhac} onChange={handleChange} rows={3} />
                    </div>
                </div>

                <div className="input-group">
                    <label>3. Khám chuyên khoa</label>
                    <textarea name="khamChuyenKhoa" value={formData.khamChuyenKhoa} onChange={handleChange} rows={6} />
                </div>
                <div className="input-group">
                    <label>4. Cận lâm sàng đã làm</label>
                    <textarea name="clsDaLam" value={formData.clsDaLam} onChange={handleChange} rows={2} />
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
                    <label>6. Tiên lượng</label>
                    <textarea name="tienLuong" value={formData.tienLuong} onChange={handleChange} rows={3} />
                </div>
                <div className="input-group">
                    <label>7. Điều trị</label>
                    <label className="text-sm mt-2">Hướng điều trị</label>
                    <textarea name="huongDieuTri" value={formData.huongDieuTri} onChange={handleChange} rows={2} />
                    <label className="text-sm mt-2">Cụ thể</label>
                    <textarea name="dieuTri" value={formData.dieuTri} onChange={handleChange} rows={4} />
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
                formType="sankhoa"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="sankhoa"
                onExport={() => generateDocx(formData)}
            />
        </div>
    );
};

export default SanKhoa;
