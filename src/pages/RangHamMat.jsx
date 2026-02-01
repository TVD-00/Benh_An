import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../components/FormSection';
import SpriteIcon from '../components/SpriteIcon';
import PreviewModal from '../components/PreviewModal';
import ChatPanel from '../components/ChatPanel';
import TuVanSection from '../components/TuVanSection';
import { generateRangHamMatDocx } from '../utils/docxGeneratorRangHamMat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocalStorage } from '../hooks/useFormCalculations';
import { validateNamSinh } from '../utils/validation';
import { toDateTimeLocalValue } from '../utils/datetime';

const STORAGE_KEY = 'ranghammat_form_data';

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

    // Hỏi bệnh
    lyDo: '',
    benhSu: '',
    tienSu: '',
    diUng: '',
    thuocDangDung: '',

    // Khám RHM
    khamNgoaiMat: '',
    khamTrongMieng: '',
    khamRang: '',
    khamNhaChu: '',
    khopCanTmj: '',

    // CLS
    canLamSang: '',
    ketQuaCLS: '',

    // Kết luận & xử trí
    tomTat: '',
    chanDoan: '',
    chanDoanPhanBiet: '',
    huongDieuTri: '',
    dieuTri: '',
    donThuoc: '',
    henTaiKham: '',
    tienLuong: '',

    // Tư vấn
    tuVanInDocx: true,
    tuVanPresets: [],
    tuVan: '',

    // Ghi chú
    bienLuan: ''
};

const RangHamMat = () => {
    const [formData, setFormData, clearFormData] = useLocalStorage(STORAGE_KEY, defaultFormData);
    const [errors, setErrors] = useState({});
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { isEnabled, isConnected, onlineCount, locks, clientId, remoteData, error: wsError, sendState, lockField, unlockField } = useWebSocket('ranghammat');

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

    useEffect(() => {
        const timer = setTimeout(() => {
            const gender = (formData.gioiTinh || '').toLowerCase();
            const age = formData.tuoi || '';
            const reason = (formData.lyDo || '').trim();

            let text = `Bệnh nhân ${gender}`;
            if (age) text += ` ${age} tuổi`;
            if (reason) text += ` đến khám vì ${reason}`;
            text += '.';

            if (text !== (formData.tomTat || '')) {
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
    }, [errors, sendState, setFormData]);

    const handleFocus = useCallback((e) => {
        lockField(e.target.name);
    }, [lockField]);

    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        unlockField(name);

        if (name !== 'namSinh') return;
        const validation = validateNamSinh(value);
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
            await generateRangHamMatDocx(formData);
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
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>Răng Hàm Mặt</h1>
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
                            <input name="khoaPhongGiuong" value={formData.khoaPhongGiuong} onChange={handleChange} placeholder="VD: RHM - P.2 - G.01" />
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

                <FormSection title="B. Hỏi Bệnh">
                    <div className="input-group">
                        <label>1. Chủ chứng</label>
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
                            <label>4. Dị ứng</label>
                            <textarea name="diUng" value={formData.diUng} onChange={handleChange} rows={2} />
                        </div>
                        <div className="input-group">
                            <label>5. Thuốc đang dùng</label>
                            <textarea name="thuocDangDung" value={formData.thuocDangDung} onChange={handleChange} rows={2} />
                        </div>
                    </div>
                </FormSection>
            </div>

            <FormSection title="C. Khám Răng Hàm Mặt" className="mt-4">
                <div className="grid-2">
                    <div className="input-group">
                        <label>1. Ngoài mặt</label>
                        <textarea name="khamNgoaiMat" value={formData.khamNgoaiMat} onChange={handleChange} rows={3} placeholder="Sưng/đau; há miệng; hạch; ..." />
                    </div>
                    <div className="input-group">
                        <label>2. Trong miệng</label>
                        <textarea name="khamTrongMieng" value={formData.khamTrongMieng} onChange={handleChange} rows={3} placeholder="Niêm mạc; lợi; mủ; ..." />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>3. Răng</label>
                        <textarea name="khamRang" value={formData.khamRang} onChange={handleChange} rows={3} placeholder="Răng sâu, răng khôn, lung lay, ..." />
                    </div>
                    <div className="input-group">
                        <label>4. Nha chu</label>
                        <textarea name="khamNhaChu" value={formData.khamNhaChu} onChange={handleChange} rows={3} placeholder="Chảy máu lợi; túi nha chu; ..." />
                    </div>
                </div>
                <div className="input-group">
                    <label>5. Khớp cắn/TMJ</label>
                    <textarea name="khopCanTmj" value={formData.khopCanTmj} onChange={handleChange} rows={2} placeholder="Đau khớp; tiếng kêu; lệch hàm; ..." />
                </div>
            </FormSection>

            <FormSection title="D. Cận Lâm Sàng" className="mt-4">
                <div className="input-group">
                    <label>1. Chỉ định</label>
                    <textarea name="canLamSang" value={formData.canLamSang} onChange={handleChange} rows={2} placeholder="Panorama/Periapical/CT..." />
                </div>
                <div className="input-group">
                    <label>2. Kết quả</label>
                    <textarea name="ketQuaCLS" value={formData.ketQuaCLS} onChange={handleChange} rows={3} />
                </div>
            </FormSection>

            <FormSection title="E. Kết Luận & Xử Trí" className="mt-4">
                <div className="input-group">
                    <label>1. Tóm tắt</label>
                    <textarea name="tomTat" value={formData.tomTat} onChange={handleChange} rows={2} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>2. Chẩn đoán</label>
                        <textarea name="chanDoan" value={formData.chanDoan} onChange={handleChange} rows={2} />
                    </div>
                    <div className="input-group">
                        <label>3. Chẩn đoán phân biệt</label>
                        <textarea name="chanDoanPhanBiet" value={formData.chanDoanPhanBiet} onChange={handleChange} rows={2} />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>4. Hướng điều trị</label>
                        <textarea name="huongDieuTri" value={formData.huongDieuTri} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>5. Điều trị/Thủ thuật</label>
                        <textarea name="dieuTri" value={formData.dieuTri} onChange={handleChange} rows={3} />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>6. Đơn thuốc</label>
                        <textarea name="donThuoc" value={formData.donThuoc} onChange={handleChange} rows={3} />
                    </div>
                    <div className="input-group">
                        <label>7. Hẹn tái khám</label>
                        <textarea name="henTaiKham" value={formData.henTaiKham} onChange={handleChange} rows={2} placeholder="Ngày/giờ; nội dung tái khám..." />
                    </div>
                </div>
                <div className="input-group">
                    <label>8. Tiên lượng</label>
                    <textarea name="tienLuong" value={formData.tienLuong} onChange={handleChange} rows={2} />
                </div>
            </FormSection>

            <FormSection title="F. Tư vấn" className="mt-4">
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
                formType="ranghammat"
            />

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={formData}
                formType="ranghammat"
                onExport={handleExport}
            />
        </div>
    );
};

export default RangHamMat;
