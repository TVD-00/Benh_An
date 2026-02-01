import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import { generateHauPhauDocx } from '../utils/docxGeneratorHauPhau';
import { DROPDOWN_OPTIONS } from '../constants/options';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocalStorage, useBMICalculation } from '../hooks/useFormCalculations';
import { validateNamSinh, validateChieuCao, validateCanNang, validateMach, validateNhietDo, validateHuyetAp, validateNhipTho } from '../utils/validation';
import ChatPanel from '../components/ChatPanel';
import { toDateTimeLocalValue } from '../utils/datetime';
import CLSDeNghiSection from '../components/CLSDeNghiSection';
import TuVanSection from '../components/TuVanSection';

const STORAGE_KEY = 'hauphau_form_data';

const defaultFormData = {
    hoTen: '',
    gioiTinh: '',
    namSinh: '',
    tuoi: '',
    danToc: '',
    ngheNghiep: '',
    tonGiao: '',
    diaChi: '',
    benhVien: '',
    khoaPhongGiuong: '',
    lienHeNguoiThanTen: '',
    lienHeNguoiThanSdt: '',
    ngayVaoVien: toDateTimeLocalValue(),
    ngayLamBenhAn: toDateTimeLocalValue(),
    lyDo: '',
    benhSuTruocMo: '',
    chanDoanTruocMo: '',
    phanLoaiMo: '',
    ngayMo: '',
    thoiGianMo: '',
    phuongPhapMo: '',
    tuongTrinhPhauThuat: '',
    dienTienHauPhau: '',
    khamVetMo: 'Vết mổ khô, không thấm dịch, không có dấu hiệu nhiễm trùng',
    tienSu: "a) Bản thân:\n  - Nội khoa: Không THA, ĐTĐ2\n  - Ngoại khoa: Chưa từng phẫu thuật\n  - Thói quen: Không thuốc lá rượu bia\n  - Không tiền sử dị ứng thuốc, thức ăn\nb) Gia đình: Không ghi nhận bệnh lý liên quan",
    khamLucVaoVien: '',
    toanThan: "- Bệnh tỉnh, tiếp xúc tốt\n- Da niêm hồng, chi ấm, mạch rõ\n- Không phù, không dấu xuất huyết\n- Tuyến giáp không to\n- Hạch ngoại vi không sờ chạm",
    mach: '',
    nhietDo: '',
    haTren: '',
    haDuoi: '',
    nhipTho: '',
    chieuCao: '',
    canNang: '',
    bmi: '',
    phanLoaiBMI: '',
    benhNgoaiKhoa: '',
    timmach: '',
    hohap: '',
    tieuhoa: '',
    than: '',
    thankinh: '',
    cokhop: '',
    coQuanKhac: 'Không phát hiện bất thường',
    clsDaLam: '',
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
};

const HauPhau = () => {
    const [formData, setFormData] = useLocalStorage(STORAGE_KEY, defaultFormData);
    const [errors, setErrors] = useState({});
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { isEnabled, isConnected, onlineCount, locks, clientId, remoteData, error: wsError, sendState, lockField, unlockField } = useWebSocket('hauphau');
    const { bmi, phanLoaiBMI } = useBMICalculation(formData.chieuCao, formData.canNang);

    useEffect(() => {
        if (bmi !== formData.bmi || phanLoaiBMI !== formData.phanLoaiBMI) {
            setFormData(prev => ({ ...prev, bmi, phanLoaiBMI }));
        }
    }, [bmi, phanLoaiBMI, formData.bmi, formData.phanLoaiBMI, setFormData]);

    useEffect(() => {
        if (remoteData) {
            setFormData(prev => ({ ...prev, ...remoteData }));
        }
    }, [remoteData, setFormData]);

    useEffect(() => {
        const validation = validateNamSinh(formData.namSinh);
        if (validation.valid && formData.namSinh) {
            const year = parseInt(formData.namSinh);
            const currentYear = new Date().getFullYear();
            const tuoi = currentYear - year;
            if (tuoi !== formData.tuoi) {
                setFormData(prev => ({ ...prev, tuoi: String(tuoi) }));
            }
        } else if (!formData.namSinh && formData.tuoi) {
            setFormData(prev => ({ ...prev, tuoi: '' }));
        }
    }, [formData.namSinh, formData.tuoi, setFormData]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const gender = (formData.gioiTinh || '').toLowerCase();
            const age = formData.tuoi || '';
            const reason = (formData.lyDo || '').toLowerCase();

            let text = `Bệnh nhân ${gender}`;
            if (age) text += ` ${age} tuổi`;
            if (reason) text += ` vào viện vì ${reason}`;
            text += `. Qua hỏi bệnh, khám bệnh ghi nhận:`;

            if (text !== formData.tomTat) {
                setFormData(prev => ({ ...prev, tomTat: text }));
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.gioiTinh, formData.tuoi, formData.lyDo, formData.tomTat, setFormData]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        setFormData(prev => {
            const next = { ...prev, [name]: val };
            sendState(next);
            return next;
        });
    }, [errors, setFormData, sendState]);

    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        unlockField(name);

        let validation;
        switch (name) {
            case 'namSinh':
                validation = validateNamSinh(value);
                break;
            case 'chieuCao':
                validation = validateChieuCao(value);
                break;
            case 'canNang':
                validation = validateCanNang(value);
                break;
            case 'mach':
                validation = validateMach(value);
                break;
            case 'nhietDo':
                validation = validateNhietDo(value);
                break;
            case 'huyetAp':
                validation = validateHuyetAp(value);
                break;
            case 'nhipTho':
                validation = validateNhipTho(value);
                break;
            default:
                validation = { valid: true };
        }

        if (!validation.valid) {
            setErrors(prev => ({ ...prev, [name]: validation.message }));
        }
    }, [unlockField]);

    const handleFocus = useCallback((e) => {
        lockField(e.target.name);
    }, [lockField]);

    const handleDropdown = useCallback((targetField) => (e) => {
        const val = e.target.value;
        if (!val) return;
        setFormData(prev => ({ ...prev, [targetField]: val }));
    }, [setFormData]);

    const isLocked = useCallback((field) => {
        return locks[field] && locks[field].by !== clientId;
    }, [locks, clientId]);

    const handleExport = useCallback(async () => {
        setIsExporting(true);
        try {
            await generateHauPhauDocx(formData);
        } catch (err) {
            console.error('Export error:', err);
            alert('Lỗi xuất file: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    }, [formData]);

    const handleReset = useCallback(() => {
        if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
            setFormData(defaultFormData);
            setErrors({});
        }
    }, [setFormData]);

    return (
        <div className="page-container" style={{ position: 'relative' }}>
            <div className="glass" style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>Hậu Phẫu</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {wsError && (
                        <span className="text-xs text-red-500" style={{ marginRight: '1rem' }}>
                            {wsError}
                        </span>
                    )}
                    {isEnabled && (
                        <div style={{
                            fontSize: '0.8rem',
                            marginRight: '1rem',
                            color: isConnected ? '#22c55e' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isConnected ? '#22c55e' : '#ef4444'
                            }}></span>
                            {isConnected ? `Online: ${onlineCount}` : 'Offline'}
                        </div>
                    )}
                    <button className="btn" onClick={() => setIsPreviewOpen(true)}>
                        Xem trước
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={isExporting}
                        style={{ opacity: isExporting ? 0.6 : 1 }}
                    >
                        <SpriteIcon type="toolbar" idx={0} />
                        {isExporting ? 'Đang xuất...' : 'Xuất Word'}
                    </button>
                    <button className="btn glass" onClick={() => setIsChatOpen(true)}>
                        <SpriteIcon type="toolbar" idx={1} /> Chat
                    </button>
                    <button className="btn glass" onClick={handleReset}>
                        <SpriteIcon type="toolbar" idx={2} /> Reset
                    </button>
                </div>
            </div>

            <div className="grid-2">
                <FormSection title="A. Hành Chính">
                    <div className="input-group">
                        <label>1. Họ và tên</label>
                        <input
                            name="hoTen"
                            value={formData.hoTen}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            disabled={isLocked('hoTen')}
                        />
                        {isLocked('hoTen') && (
                            <span className="text-xs text-red-500">
                                <SpriteIcon type="misc" idx={2} size={12} /> Đang được sửa...
                            </span>
                        )}
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
                            <label>3. Năm sinh</label>
                            <input
                                name="namSinh"
                                type="number"
                                value={formData.namSinh}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={errors.namSinh ? 'error' : ''}
                            />
                            {errors.namSinh && <span className="error-message">{errors.namSinh}</span>}
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Tuổi</label>
                        <div className="glass" style={{ padding: '0.75rem' }}>
                            {formData.tuoi || '-'}
                        </div>
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
                            <input name="khoaPhongGiuong" value={formData.khoaPhongGiuong} onChange={handleChange} placeholder="VD: Ngoại - P.3 - G.12" />
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

                <FormSection title="B. Bệnh Án">
                    <div className="input-group">
                        <label>1. Lý do vào viện</label>
                        <textarea name="lyDo" value={formData.lyDo} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>2. Bệnh sử</label>
                        <div className="glass" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                            <label className="text-sm font-bold">Quá trình trước mổ</label>
                            <textarea name="benhSuTruocMo" value={formData.benhSuTruocMo} onChange={handleChange} rows={3} placeholder="Diễn tiến, CLS, xử trí..." />

                            <label className="text-sm font-bold mt-2">Quá trình mổ</label>
                            <div className="grid-2">
                                <input name="chanDoanTruocMo" value={formData.chanDoanTruocMo} onChange={handleChange} placeholder="Chẩn đoán trước mổ" />
                                <input name="phanLoaiMo" value={formData.phanLoaiMo} onChange={handleChange} placeholder="Phân loại" />
                            </div>
                            <div className="grid-2 mt-1">
                                <input name="ngayMo" type="date" value={formData.ngayMo} onChange={handleChange} placeholder="Ngày mổ" />
                                <input name="thoiGianMo" value={formData.thoiGianMo} onChange={handleChange} placeholder="Thời gian mổ" />
                            </div>
                            <div className="grid-2 mt-1">
                                <input name="phuongPhapMo" value={formData.phuongPhapMo} onChange={handleChange} placeholder="Phương pháp" />
                            </div>
                            <textarea name="tuongTrinhPhauThuat" value={formData.tuongTrinhPhauThuat} onChange={handleChange} rows={3} placeholder="Tường trình phẫu thuật" className="mt-1" />

                            <label className="text-sm font-bold mt-2">Khám vết mổ</label>
                            <textarea name="khamVetMo" value={formData.khamVetMo} onChange={handleChange} rows={2} placeholder="Mô tả tình trạng vết mổ..." />

                            <label className="text-sm font-bold mt-2">Diễn tiến hậu phẫu</label>
                            <textarea name="dienTienHauPhau" value={formData.dienTienHauPhau} onChange={handleChange} rows={3} placeholder="Diễn tiến lâm sàng sau mổ..." />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>3. Tiền sử</label>
                        <textarea name="tienSu" value={formData.tienSu} onChange={handleChange} rows={5} />
                    </div>
                </FormSection>
            </div>

            <FormSection title="II. Khám Bệnh" className="mt-4">
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
                        <div>
                            Mạch:
                            <input
                                name="mach"
                                value={formData.mach}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '60px' }}
                                className={errors.mach ? 'error' : ''}
                            /> l/p
                            {errors.mach && <span className="error-message">{errors.mach}</span>}
                        </div>
                        <div>
                            Nhiệt:
                            <input
                                name="nhietDo"
                                value={formData.nhietDo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '60px' }}
                                className={errors.nhietDo ? 'error' : ''}
                            /> °C
                            {errors.nhietDo && <span className="error-message">{errors.nhietDo}</span>}
                        </div>
                        <div>
                            HA:
                            <input
                                name="haTren"
                                value={formData.haTren}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '50px' }}
                                placeholder="120"
                                className={errors.haTren ? 'error' : ''}
                            />/
                            <input
                                name="haDuoi"
                                value={formData.haDuoi}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '50px' }}
                                placeholder="80"
                                className={errors.haDuoi ? 'error' : ''}
                            /> mmHg
                            {(errors.haTren || errors.haDuoi) && <span className="error-message">{errors.haTren || errors.haDuoi}</span>}
                        </div>
                        <div>
                            Nhịp thở:
                            <input
                                name="nhipTho"
                                value={formData.nhipTho}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '60px' }}
                                className={errors.nhipTho ? 'error' : ''}
                            /> l/p
                            {errors.nhipTho && <span className="error-message">{errors.nhipTho}</span>}
                        </div>
                    </div>
                    <div className="grid-3">
                        <div>
                            Cao:
                            <input
                                name="chieuCao"
                                value={formData.chieuCao}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '60px' }}
                                className={errors.chieuCao ? 'error' : ''}
                            /> cm
                            {errors.chieuCao && <span className="error-message">{errors.chieuCao}</span>}
                        </div>
                        <div>
                            Nặng:
                            <input
                                name="canNang"
                                value={formData.canNang}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ width: '60px' }}
                                className={errors.canNang ? 'error' : ''}
                            /> kg
                            {errors.canNang && <span className="error-message">{errors.canNang}</span>}
                        </div>
                        <div>
                            BMI: <b>{formData.bmi || '-'}</b> ({formData.phanLoaiBMI || '-'})
                        </div>
                    </div>
                </div>

                <div className="input-group">
                    <label>1. Toàn trạng</label>
                    <textarea name="toanThan" value={formData.toanThan} onChange={handleChange} rows={3} />
                </div>

                <div className="input-group">
                    <label>2. Bệnh ngoại khoa</label>
                    <textarea name="benhNgoaiKhoa" value={formData.benhNgoaiKhoa} onChange={handleChange} rows={3} placeholder="Triệu chứng thực thể ngoại khoa" />
                </div>

                <div className="grid-2">
                    {Object.entries(DROPDOWN_OPTIONS).map(([key, options]) => {
                        if (['timmach', 'hohap', 'tieuhoa', 'than', 'thankinh', 'cokhop'].includes(key)) {
                            const labels = {
                                timmach: '3a) Tuần hoàn',
                                hohap: '3b) Hô hấp',
                                tieuhoa: '3c) Tiêu hoá',
                                than: '3d) Thận - Tiết niệu',
                                thankinh: '3e) Thần kinh',
                                cokhop: '3f) Cơ xương khớp'
                            };
                            return (
                                <div className="input-group" key={key}>
                                    <label>{labels[key]}</label>
                                    <select onChange={handleDropdown(key)} value="">
                                        <option value="">-- Chọn --</option>
                                        {options.map((opt, i) => (
                                            <option key={i} value={opt}>{opt.substring(0, 40)}...</option>
                                        ))}
                                    </select>
                                    <textarea name={key} value={formData[key]} onChange={handleChange} rows={3} />
                                </div>
                            );
                        }
                        return null;
                    })}
                    <div className="input-group">
                        <label>3g) Khác</label>
                        <textarea name="coQuanKhac" value={formData.coQuanKhac} onChange={handleChange} rows={3} />
                    </div>
                </div>

                <div className="input-group">
                    <label>4. Cận lâm sàng đã làm</label>
                    <textarea name="clsDaLam" value={formData.clsDaLam} onChange={handleChange} rows={2} placeholder="CLS đã làm tính đến thời điểm khám" />
                </div>
            </FormSection>

            <FormSection title="III. Kết Luận" className="mt-4">
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

            <FormSection title="IV. Tư vấn" className="mt-4">
                <TuVanSection formData={formData} setFormData={setFormData} sendState={sendState} />
            </FormSection>

            <FormSection title="C. Biện Luận" className="mt-4">
                <textarea name="bienLuan" value={formData.bienLuan} onChange={handleChange} rows={5} />
            </FormSection>

            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                formData={formData}
                setFormData={setFormData}
                formType="hauphau"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="hauphau"
                onExport={handleExport}
            />
        </div>
    );
};

export default HauPhau;
