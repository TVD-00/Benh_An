import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import ChatPanel from '../components/ChatPanel';
import CLSDeNghiSection from '../components/CLSDeNghiSection';
import TuVanSection from '../components/TuVanSection';
import { generateGMHSDocx } from '../utils/docxGeneratorGMHS';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocalStorage, useBMICalculation } from '../hooks/useFormCalculations';
import { validateNamSinh, validateChieuCao, validateCanNang, validateMach, validateNhietDo, validateNhipTho } from '../utils/validation';
import { toDateTimeLocalValue } from '../utils/datetime';

const STORAGE_KEY = 'gmhs_form_data';

const defaultFormData = {
    // Hành chính
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

    // Thông tin phẫu thuật
    chanDoanPhauThuat: '',
    phauThuatDuKien: '',
    ngayMoDuKien: '',
    phuongPhapVoCamDuKien: '',

    // Hỏi bệnh
    lyDo: '',
    benhSu: '',
    tienSu: '',
    thuocDangDung: '',
    diUng: '',
    tienSuGayMe: '',
    thoiQuen: '',

    // Khám tiền mê
    khamLucVaoVien: '',
    toanThan: '',
    mach: '',
    nhietDo: '',
    haTren: '',
    haDuoi: '',
    nhipTho: '',
    chieuCao: '',
    canNang: '',
    bmi: '',
    phanLoaiBMI: '',
    timmach: '',
    hohap: '',

    // Đường thở & nguy cơ
    asa: '',
    airwayMallampati: '',
    airwayHaMiengCm: '',
    airwayCo: '',
    airwayRangGia: '',
    airwayDuKienKho: '',
    nguyCoPhauthuat: '',
    nguyCoVoCam: '',

    // Kế hoạch vô cảm
    keHoachVoCam: '',
    keHoachGiamDau: '',
    duPhongPONV: '',
    keHoachHoiSuc: '',

    // CLS (theo nhóm mục tiêu)
    clsThuongQuy: 'CTM; đông máu cơ bản; sinh hóa máu; điện giải đồ; ECG; X-quang ngực',
    clsChuanDoan: '',
    clsChanDoanPresets: [],
    clsTimNguyenNhanPresets: [],
    clsHoTroDieuTriPresets: [],
    clsTheoDoiTienLuongPresets: [],
    clsHoTroDieuTri: '',
    clsTheoDoiTienLuong: '',
    ketQua: '',

    // Kết luận
    tomTat: '',
    ketLuanGMHS: '',

    // Tư vấn
    tuVanInDocx: true,
    tuVanPresets: [],
    tuVan: '',

    // Ghi chú
    bienLuan: ''
};

const GMHS = () => {
    const [formData, setFormData, clearFormData] = useLocalStorage(STORAGE_KEY, defaultFormData);
    const [errors, setErrors] = useState({});
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { isEnabled, isConnected, onlineCount, locks, clientId, remoteData, error: wsError, sendState, lockField, unlockField } = useWebSocket('gmhs');
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
            if (String(tuoi) !== String(formData.tuoi || '')) {
                setFormData(prev => ({ ...prev, tuoi: String(tuoi) }));
            }
        } else if (!formData.namSinh && formData.tuoi) {
            setFormData(prev => ({ ...prev, tuoi: '' }));
        }
    }, [formData.namSinh, formData.tuoi, setFormData]);

    // Auto summary
    useEffect(() => {
        const timer = setTimeout(() => {
            const gender = (formData.gioiTinh || '').toLowerCase();
            const age = formData.tuoi || '';
            const pt = (formData.phauThuatDuKien || '').trim();
            const cd = (formData.chanDoanPhauThuat || '').trim();

            let text = `Bệnh nhân ${gender}`;
            if (age) text += ` ${age} tuổi`;
            if (pt) text += ` được đánh giá tiền mê cho ${pt}`;
            if (cd) text += ` (${cd})`;
            if (text.endsWith(')')) text += '.';
            else text += '.';

            if (text !== (formData.tomTat || '')) {
                setFormData(prev => ({ ...prev, tomTat: text }));
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.gioiTinh, formData.tuoi, formData.phauThuatDuKien, formData.chanDoanPhauThuat, formData.tomTat, setFormData]);

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
    }, [errors, sendState, setFormData]);

    const handleFocus = useCallback((e) => {
        lockField(e.target.name);
    }, [lockField]);

    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        unlockField(name);

        let validation = { valid: true };
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

    const isLocked = useCallback((field) => {
        return locks[field] && locks[field].by !== clientId;
    }, [locks, clientId]);

    const handleExport = useCallback(async () => {
        setIsExporting(true);
        try {
            await generateGMHSDocx(formData);
        } catch (err) {
            console.error('Export error:', err);
            alert('Lỗi xuất file: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    }, [formData]);

    const handleReset = useCallback(() => {
        if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
            clearFormData();
            setErrors({});
        }
    }, [clearFormData]);

    return (
        <div className="page-container" style={{ position: 'relative' }}>
            <div className="glass" style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>GMHS (Khám tiền mê)</h1>
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

                    <button className="btn" onClick={() => setIsChatOpen(true)}>
                        <SpriteIcon type="toolbar" idx={1} /> Chat
                    </button>

                    <button className="btn" onClick={handleReset}>
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
                        <div className="glass" style={{ padding: '0.75rem' }}>{formData.tuoi || '-'}</div>
                    </div>

                    <div className="grid-2">
                        <div className="input-group">
                            <label>4. Dân tộc</label>
                            <input name="danToc" value={formData.danToc} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>5. Nghề nghiệp</label>
                            <input name="ngheNghiep" value={formData.ngheNghiep} onChange={handleChange} />
                        </div>
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
                            <input name="khoaPhongGiuong" value={formData.khoaPhongGiuong} onChange={handleChange} placeholder="VD: GMHS - P.1 - G.02" />
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
                        <label>Ngày giờ vào viện</label>
                        <input name="ngayVaoVien" type="datetime-local" value={formData.ngayVaoVien} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Ngày giờ làm bệnh án</label>
                        <input name="ngayLamBenhAn" type="datetime-local" value={formData.ngayLamBenhAn} onChange={handleChange} />
                    </div>
                </FormSection>

                <FormSection title="B. Thông Tin Phẫu Thuật/Thủ Thuật">
                    <div className="input-group">
                        <label>Chẩn đoán phẫu thuật</label>
                        <textarea name="chanDoanPhauThuat" value={formData.chanDoanPhauThuat} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>Phẫu thuật/thủ thuật dự kiến</label>
                        <textarea name="phauThuatDuKien" value={formData.phauThuatDuKien} onChange={handleChange} rows={2} />
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Ngày mổ dự kiến</label>
                            <input name="ngayMoDuKien" type="date" value={formData.ngayMoDuKien} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Phương pháp vô cảm dự kiến</label>
                            <input name="phuongPhapVoCamDuKien" value={formData.phuongPhapVoCamDuKien} onChange={handleChange} placeholder="GM NKQ / GT vùng / an thần..." />
                        </div>
                    </div>
                </FormSection>
            </div>

            <FormSection title="C. Hỏi Bệnh" className="mt-4">
                <div className="input-group">
                    <label>1. Lý do/Chỉ định tiền mê</label>
                    <textarea name="lyDo" value={formData.lyDo} onChange={handleChange} rows={2} />
                </div>
                <div className="input-group">
                    <label>2. Bệnh sử</label>
                    <textarea name="benhSu" value={formData.benhSu} onChange={handleChange} rows={3} />
                </div>
                <div className="input-group">
                    <label>3. Tiền sử</label>
                    <textarea name="tienSu" value={formData.tienSu} onChange={handleChange} rows={3} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>4. Thuốc đang dùng</label>
                        <textarea name="thuocDangDung" value={formData.thuocDangDung} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>5. Dị ứng</label>
                        <textarea name="diUng" value={formData.diUng} onChange={handleChange} rows={2} placeholder="Thuốc/Thức ăn/Khác..." />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>6. Tiền sử vô cảm/gây mê</label>
                        <textarea name="tienSuGayMe" value={formData.tienSuGayMe} onChange={handleChange} rows={2} placeholder="Có/không; biến chứng; PONV..." />
                    </div>
                    <div className="input-group">
                        <label>7. Thói quen/Yếu tố nguy cơ</label>
                        <textarea name="thoiQuen" value={formData.thoiQuen} onChange={handleChange} rows={2} placeholder="Thuốc lá/rượu; OSA; ..." />
                    </div>
                </div>
            </FormSection>

            <FormSection title="D. Khám Tiền Mê" className="mt-4">
                <div className="input-group">
                    <label>Khám lúc vào viện</label>
                    <textarea name="khamLucVaoVien" value={formData.khamLucVaoVien} onChange={handleChange} rows={2} />
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
                            <input name="haTren" value={formData.haTren} onChange={handleChange} style={{ width: '50px' }} placeholder="120" />/
                            <input name="haDuoi" value={formData.haDuoi} onChange={handleChange} style={{ width: '50px' }} placeholder="80" /> mmHg
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
                    <label>Toàn trạng</label>
                    <textarea name="toanThan" value={formData.toanThan} onChange={handleChange} rows={3} placeholder="Tỉnh/tái; tim phổi; ..." />
                </div>

                <div className="grid-2">
                    <div className="input-group">
                        <label>Tim mạch</label>
                        <textarea name="timmach" value={formData.timmach} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Hô hấp</label>
                        <textarea name="hohap" value={formData.hohap} onChange={handleChange} rows={3} />
                    </div>
                </div>
            </FormSection>

            <FormSection title="E. Đường Thở & Nguy Cơ" className="mt-4">
                <div className="grid-3">
                    <div className="input-group">
                        <label>ASA</label>
                        <input name="asa" value={formData.asa} onChange={handleChange} placeholder="I/II/III/IV..." />
                    </div>
                    <div className="input-group">
                        <label>Mallampati</label>
                        <input name="airwayMallampati" value={formData.airwayMallampati} onChange={handleChange} placeholder="I/II/III/IV" />
                    </div>
                    <div className="input-group">
                        <label>Há miệng (cm)</label>
                        <input name="airwayHaMiengCm" value={formData.airwayHaMiengCm} onChange={handleChange} placeholder="VD: 3" />
                    </div>
                </div>

                <div className="grid-2">
                    <div className="input-group">
                        <label>Cổ (vận động/cứng cổ)</label>
                        <input name="airwayCo" value={formData.airwayCo} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Răng giả/răng lung lay</label>
                        <input name="airwayRangGia" value={formData.airwayRangGia} onChange={handleChange} />
                    </div>
                </div>

                <div className="input-group">
                    <label>Dự kiến khó đặt NKQ</label>
                    <input name="airwayDuKienKho" value={formData.airwayDuKienKho} onChange={handleChange} placeholder="Không/Có: lý do..." />
                </div>

                <div className="grid-2">
                    <div className="input-group">
                        <label>Nguy cơ phẫu thuật</label>
                        <textarea name="nguyCoPhauthuat" value={formData.nguyCoPhauthuat} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Nguy cơ vô cảm</label>
                        <textarea name="nguyCoVoCam" value={formData.nguyCoVoCam} onChange={handleChange} rows={3} />
                    </div>
                </div>
            </FormSection>

            <FormSection title="F. Kế Hoạch Vô Cảm" className="mt-4">
                <div className="input-group">
                    <label>1. Phương pháp vô cảm</label>
                    <textarea name="keHoachVoCam" value={formData.keHoachVoCam} onChange={handleChange} rows={3} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>2. Kế hoạch giảm đau</label>
                        <textarea name="keHoachGiamDau" value={formData.keHoachGiamDau} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>3. Dự phòng PONV</label>
                        <textarea name="duPhongPONV" value={formData.duPhongPONV} onChange={handleChange} rows={3} />
                    </div>
                </div>
                <div className="input-group">
                    <label>4. Hồi sức sau mổ</label>
                    <textarea name="keHoachHoiSuc" value={formData.keHoachHoiSuc} onChange={handleChange} rows={3} placeholder="PACU/ICU; thở máy; theo dõi..." />
                </div>
            </FormSection>

            <FormSection title="G. Cận Lâm Sàng" className="mt-4">
                <CLSDeNghiSection formData={formData} setFormData={setFormData} sendState={sendState} />
                <div className="input-group mt-2">
                    <label>Kết quả</label>
                    <textarea name="ketQua" value={formData.ketQua} onChange={handleChange} rows={3} />
                </div>
            </FormSection>

            <FormSection title="H. Kết Luận" className="mt-4">
                <div className="input-group">
                    <label>1. Tóm tắt</label>
                    <textarea name="tomTat" value={formData.tomTat} onChange={handleChange} rows={2} />
                </div>
                <div className="input-group">
                    <label>2. Kết luận/đề xuất</label>
                    <textarea name="ketLuanGMHS" value={formData.ketLuanGMHS} onChange={handleChange} rows={3} placeholder="Đủ điều kiện/Trì hoãn; khuyến nghị..." />
                </div>
            </FormSection>

            <FormSection title="I. Tư vấn" className="mt-4">
                <TuVanSection formData={formData} setFormData={setFormData} sendState={sendState} />
            </FormSection>

            <FormSection title="Ghi chú/biện luận thêm" className="mt-4">
                <textarea name="bienLuan" value={formData.bienLuan} onChange={handleChange} rows={5} />
            </FormSection>

            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                formData={formData}
                setFormData={setFormData}
                formType="gmhs"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="gmhs"
                onExport={handleExport}
            />
        </div>
    );
};

export default GMHS;
