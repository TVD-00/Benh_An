import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import ChatPanel from '../components/ChatPanel';
import TuVanSection from '../components/TuVanSection';
import { generateYHCTDocx } from '../utils/docxGeneratorYHCT';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocalStorage } from '../hooks/useFormCalculations';
import { validateNamSinh } from '../utils/validation';
import { toDateTimeLocalValue } from '../utils/datetime';
import { YHCT_PRESETS } from '../constants/options';

const STORAGE_KEY = 'yhct_form_data';

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

    // Hỏi bệnh (YHCT)
    lyDo: '',
    benhSu: '',
    tienSu: '',

    // YHCT
    yhctVong: '',
    yhctVan: '',
    yhctVanHoi: '',
    yhctThiet: '',
    yhctBatCuong: '',
    yhctTangPhu: '',
    yhctChanDoan: '',
    yhctPhapTri: '',
    yhctPhuongThang: '',

    // Tư vấn
    tuVanInDocx: true,
    tuVanPresets: [],
    tuVan: '',

    // Biện luận (tuỳ chọn)
    bienLuan: ''
};

const YHCT = () => {
    const [formData, setFormData, clearFormData] = useLocalStorage(STORAGE_KEY, defaultFormData);
    const [errors, setErrors] = useState({});
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { isEnabled, isConnected, onlineCount, remoteData, error: wsError, sendState } = useWebSocket('yhct');

    useEffect(() => {
        if (remoteData) {
            setFormData(prev => ({ ...prev, ...remoteData }));
        }
    }, [remoteData, setFormData]);

    // Auto Calculate Age
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
        if (name !== 'namSinh') return;
        const validation = validateNamSinh(value);
        if (!validation.valid) setErrors(prev => ({ ...prev, [name]: validation.message }));
    }, []);

    const handlePreset = useCallback((field) => (e) => {
        const val = e.target.value;
        if (!val) return;
        setFormData(prev => {
            const next = { ...prev, [field]: val };
            sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleExport = useCallback(async () => {
        setIsExporting(true);
        try {
            await generateYHCTDocx(formData);
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
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>YHCT (Y học cổ truyền)</h1>
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
                        <label>Họ và tên</label>
                        <input name="hoTen" value={formData.hoTen} onChange={handleChange} />
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Giới tính</label>
                            <select name="gioiTinh" value={formData.gioiTinh} onChange={handleChange}>
                                <option value="">-- Chọn --</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Năm sinh</label>
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
                            <label>Dân tộc</label>
                            <input name="danToc" value={formData.danToc} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Nghề nghiệp</label>
                            <input name="ngheNghiep" value={formData.ngheNghiep} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Tôn giáo</label>
                        <input name="tonGiao" value={formData.tonGiao} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Địa chỉ</label>
                        <textarea name="diaChi" value={formData.diaChi} onChange={handleChange} rows={2} />
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Bệnh viện</label>
                            <input name="benhVien" value={formData.benhVien} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Khoa/Phòng/Giường</label>
                            <input name="khoaPhongGiuong" value={formData.khoaPhongGiuong} onChange={handleChange} placeholder="VD: Nội - P.12 - G.05" />
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

                <FormSection title="B. Hỏi bệnh (YHCT)">
                    <div className="input-group">
                        <label>Lý do vào viện</label>
                        <textarea name="lyDo" value={formData.lyDo} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>Bệnh sử</label>
                        <textarea name="benhSu" value={formData.benhSu} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Tiền sử</label>
                        <textarea name="tienSu" value={formData.tienSu} onChange={handleChange} rows={3} />
                    </div>
                </FormSection>
            </div>

            <FormSection title="C. YHCT" className="mt-4">
                <div className="grid-2">
                    <div className="input-group">
                        <label>Vọng</label>
                        <select onChange={handlePreset('yhctVong')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.vong.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctVong" value={formData.yhctVong} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Văn</label>
                        <select onChange={handlePreset('yhctVan')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.van.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctVan" value={formData.yhctVan} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Vấn</label>
                        <select onChange={handlePreset('yhctVanHoi')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.vanHoi.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctVanHoi" value={formData.yhctVanHoi} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Thiết</label>
                        <select onChange={handlePreset('yhctThiet')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.thiet.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctThiet" value={formData.yhctThiet} onChange={handleChange} rows={3} />
                    </div>
                </div>

                <div className="grid-2">
                    <div className="input-group">
                        <label>Bát cương (tuỳ chọn)</label>
                        <select onChange={handlePreset('yhctBatCuong')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.batCuong.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctBatCuong" value={formData.yhctBatCuong} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>Tạng phủ (tuỳ chọn)</label>
                        <select onChange={handlePreset('yhctTangPhu')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.tangPhu.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctTangPhu" value={formData.yhctTangPhu} onChange={handleChange} rows={3} />
                    </div>
                </div>

                <div className="input-group">
                    <label>Chẩn đoán YHCT</label>
                    <textarea name="yhctChanDoan" value={formData.yhctChanDoan} onChange={handleChange} rows={2} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Pháp trị</label>
                        <select onChange={handlePreset('yhctPhapTri')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.phapTri.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctPhapTri" value={formData.yhctPhapTri} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>Phương thang/không dùng thuốc</label>
                        <select onChange={handlePreset('yhctPhuongThang')} value="">
                            <option value="">-- Chọn --</option>
                            {YHCT_PRESETS.phuongThang.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                        <textarea name="yhctPhuongThang" value={formData.yhctPhuongThang} onChange={handleChange} rows={2} />
                    </div>
                </div>
            </FormSection>

            <FormSection title="D. Tư vấn" className="mt-4">
                <TuVanSection formData={formData} setFormData={setFormData} sendState={sendState} />
            </FormSection>

            <FormSection title="Ghi chú/biện luận thêm (tuỳ chọn)" className="mt-4">
                <textarea name="bienLuan" value={formData.bienLuan} onChange={handleChange} rows={5} />
            </FormSection>

            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                formData={formData}
                setFormData={setFormData}
                formType="yhct"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="yhct"
                onExport={handleExport}
            />
        </div>
    );
};

export default YHCT;
