import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import { generatePhuKhoaDocx } from '../utils/docxGeneratorPhuKhoa';
import { DROPDOWN_OPTIONS } from '../constants/options';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocalStorage, useBMICalculation } from '../hooks/useFormCalculations';
import { validateNamSinh, validateChieuCao, validateCanNang, validateMach, validateNhietDo, validateHuyetAp, validateNhipTho, validatePARA } from '../utils/validation';
import ChatPanel from '../components/ChatPanel';
import { toDateTimeLocalValue } from '../utils/datetime';
import CLSDeNghiSection from '../components/CLSDeNghiSection';
import TuVanSection from '../components/TuVanSection';

const STORAGE_KEY = 'phukhoa_form_data';

const defaultFormData = {
    hoTen: '',
    namSinh: '',
    tuoi: '',
    // PARA tách 4 ô: sanh đủ tháng, thiếu tháng, sẩy/nạo/hút, con hiện có
    paraDuThang: '',
    paraThieuThang: '',
    paraSayNaoHut: '',
    paraConHienCo: '',
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
    tienSu: "a) Bản thân:\n  - Nội khoa: Không THA, ĐTĐ2\n  - Ngoại khoa: Chưa từng phẫu thuật\n  - Thói quen: Không thuốc lá rượu bia\n  - Không tiền sử dị ứng thuốc, thức ăn\nb) Gia đình: Không ghi nhận bệnh lý liên quan",
    kinhCuoiMode: 'quen',
    kinhCuoiDate: '',
    kinhCuoiTinhChat: '',
    kinhApCuoiMode: 'quen',
    kinhApCuoiDate: '',
    tuoiLayChong: '',
    bienPhapTranhThai: '',
    benhSuNhapVien: '',
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
    timmach: '',
    hohap: '',
    tieuhoa: '',
    than: '',
    thankinh: '',
    cokhop: '',
    coQuanKhac: 'Không phát hiện bất thường',
    khamChuyenKhoa: '',
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

const PhuKhoa = () => {
    const [formData, setFormData] = useLocalStorage(STORAGE_KEY, defaultFormData);
    const [errors, setErrors] = useState({});
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { isEnabled, isConnected, onlineCount, locks, clientId, remoteData, error: wsError, sendState, lockField, unlockField } = useWebSocket('phukhoa');
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
            const age = formData.tuoi || '...';
            const paraParts = [
                String(formData.paraDuThang || '').trim(),
                String(formData.paraThieuThang || '').trim(),
                String(formData.paraSayNaoHut || '').trim(),
                String(formData.paraConHienCo || '').trim(),
            ];
            const hasAnyPara = paraParts.some(Boolean);
            const para = hasAnyPara ? paraParts.map(p => (p || '0')).join('') : '....';
            const reason = formData.lyDo || '...';

            let kinhCuoiText = 'quên';
            if (formData.kinhCuoiMode !== 'quen') {
                const d = formData.kinhCuoiDate ? new Date(formData.kinhCuoiDate) : null;
                if (d && !isNaN(d.getTime())) {
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    kinhCuoiText = `${dd}/${mm}/${yyyy}`;
                } else {
                    kinhCuoiText = '..../..../....';
                }
            }

            const summ = `Bệnh nhân ${age} tuổi, PARA ${para}, kinh cuối ${kinhCuoiText}, vào viện vì lý do ${reason}. Qua hỏi bệnh, khám bệnh ghi nhận:`;

            if (summ !== formData.tomTat) {
                setFormData(prev => ({ ...prev, tomTat: summ }));
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [
        formData.tuoi,
        formData.paraDuThang,
        formData.paraThieuThang,
        formData.paraSayNaoHut,
        formData.paraConHienCo,
        formData.lyDo,
        formData.kinhCuoiMode,
        formData.kinhCuoiDate,
        formData.tomTat,
        setFormData
    ]);

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
            case 'para':
                validation = validatePARA(value);
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
            await generatePhuKhoaDocx(formData);
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
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>Phụ Khoa</h1>
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
                            <label>2. Năm sinh</label>
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
                        <div className="input-group">
                            <label>Tuổi</label>
                            <div className="glass" style={{ padding: '0.75rem' }}>
                                {formData.tuoi || '-'}
                            </div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>3. PARA</label>
                        <div className="glass" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                name="paraDuThang"
                                value={formData.paraDuThang}
                                onChange={handleChange}
                                style={{ width: '50px', textAlign: 'center' }}
                                placeholder="0"
                            />
                            <input
                                name="paraThieuThang"
                                value={formData.paraThieuThang}
                                onChange={handleChange}
                                style={{ width: '50px', textAlign: 'center' }}
                                placeholder="0"
                            />
                            <input
                                name="paraSayNaoHut"
                                value={formData.paraSayNaoHut}
                                onChange={handleChange}
                                style={{ width: '50px', textAlign: 'center' }}
                                placeholder="0"
                            />
                            <input
                                name="paraConHienCo"
                                value={formData.paraConHienCo}
                                onChange={handleChange}
                                style={{ width: '50px', textAlign: 'center' }}
                                placeholder="0"
                            />
                        </div>
                        <span className="text-xs" style={{ marginTop: '0.25rem' }}>(Đủ tháng - Thiếu tháng - Sẩy/Nạo/Hút - Con hiện có)</span>
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
                        <div className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
                            <div className="grid-2" style={{ marginBottom: '0.5rem' }}>
                                <div>
                                    <label className="text-sm">Kinh cuối</label>
                                    <select name="kinhCuoiMode" value={formData.kinhCuoiMode} onChange={handleChange} style={{ marginBottom: '0.5rem' }}>
                                        <option value="quen">Quên</option>
                                        <option value="ngay">Nhập ngày</option>
                                    </select>
                                    {formData.kinhCuoiMode === 'ngay' && (
                                        <>
                                            <input type="date" name="kinhCuoiDate" value={formData.kinhCuoiDate} onChange={handleChange} style={{ marginBottom: '0.5rem' }} />
                                            <input name="kinhCuoiTinhChat" value={formData.kinhCuoiTinhChat} onChange={handleChange} placeholder="Tính chất kinh cuối..." />
                                        </>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm">Kinh áp cuối</label>
                                    <select name="kinhApCuoiMode" value={formData.kinhApCuoiMode} onChange={handleChange} style={{ marginBottom: '0.5rem' }}>
                                        <option value="quen">Quên</option>
                                        <option value="ngay">Nhập ngày</option>
                                    </select>
                                    {formData.kinhApCuoiMode === 'ngay' && (
                                        <input type="date" name="kinhApCuoiDate" value={formData.kinhApCuoiDate} onChange={handleChange} />
                                    )}
                                </div>
                            </div>
                            <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                                <div>
                                    <label className="text-sm">Tuổi lấy chồng</label>
                                    <input name="tuoiLayChong" value={formData.tuoiLayChong} onChange={handleChange} type="number" placeholder="Tuổi..." />
                                </div>
                                <div>
                                    <label className="text-sm">Biện pháp tránh thai</label>
                                    <input name="bienPhapTranhThai" value={formData.bienPhapTranhThai} onChange={handleChange} placeholder="Đang dùng..." />
                                </div>
                            </div>
                            <textarea name="benhSuNhapVien" value={formData.benhSuNhapVien} onChange={handleChange} rows={3} placeholder="Diễn tiến bệnh..." style={{ marginTop: '0.5rem' }} />
                        </div>
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

                <div className="grid-2">
                    {Object.entries(DROPDOWN_OPTIONS).map(([key, options]) => {
                        if (['timmach', 'hohap', 'tieuhoa', 'than', 'thankinh', 'cokhop'].includes(key)) {
                            const labels = {
                                timmach: '2a) Tuần hoàn',
                                hohap: '2b) Hô hấp',
                                tieuhoa: '2c) Tiêu hoá',
                                than: '2d) Thận - Tiết niệu',
                                thankinh: '2e) Thần kinh',
                                cokhop: '2f) Cơ xương khớp'
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
                        <label>2f) Khác</label>
                        <textarea name="coQuanKhac" value={formData.coQuanKhac} onChange={handleChange} rows={3} />
                    </div>
                </div>

                <div className="input-group">
                    <label>3. Khám chuyên khoa</label>
                    <textarea name="khamChuyenKhoa" value={formData.khamChuyenKhoa} onChange={handleChange} rows={5} />
                </div>

                <div className="input-group">
                    <label>4. Cận lâm sàng đã làm</label>
                    <textarea name="clsDaLam" value={formData.clsDaLam} onChange={handleChange} rows={2} />
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
                formType="phukhoa"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="phukhoa"
                onExport={handleExport}
            />
        </div>
    );
};

export default PhuKhoa;
