import React, { useCallback, useState } from 'react';
import { CLS_DE_NGHI_PRESETS } from '../constants/options';

const GROUPS = [
    {
        key: 'chanDoan',
        title: 'Chẩn đoán',
        selectedKey: 'clsChanDoanPresets',
        noteKey: 'clsChuanDoan'
    },
    {
        key: 'timNguyenNhan',
        title: 'Tìm nguyên nhân',
        selectedKey: 'clsTimNguyenNhanPresets',
        noteKey: 'clsThuongQuy'
    },
    {
        key: 'hoTroDieuTri',
        title: 'Hỗ trợ điều trị',
        selectedKey: 'clsHoTroDieuTriPresets',
        noteKey: 'clsHoTroDieuTri'
    },
    {
        key: 'theoDoiTienLuong',
        title: 'Theo dõi/tiên lượng',
        selectedKey: 'clsTheoDoiTienLuongPresets',
        noteKey: 'clsTheoDoiTienLuong'
    }
];

function toggleInArray(arr, value) {
    const cur = Array.isArray(arr) ? arr : [];
    return cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
}

const CLSDeNghiSection = ({ formData, setFormData, sendState }) => {
    const [filters, setFilters] = useState(() => ({}));

    const handleTextChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleTogglePreset = useCallback((selectedKey, preset) => {
        setFormData(prev => {
            const nextArr = toggleInArray(prev?.[selectedKey], preset);
            const next = { ...prev, [selectedKey]: nextArr };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleSelectAll = useCallback((selectedKey, presets) => {
        setFormData(prev => {
            const next = { ...prev, [selectedKey]: Array.isArray(presets) ? presets : [] };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleClearAll = useCallback((selectedKey) => {
        setFormData(prev => {
            const next = { ...prev, [selectedKey]: [] };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const setFilterValue = useCallback((groupKey, value) => {
        setFilters(prev => ({ ...prev, [groupKey]: value }));
    }, []);

    return (
        <div className="glass" style={{ padding: '1rem', marginTop: '0.5rem' }}>
            {GROUPS.map(group => {
                const presets = CLS_DE_NGHI_PRESETS[group.key] || [];
                const filterValue = String(filters?.[group.key] || '');
                const q = filterValue.trim().toLowerCase();
                const visiblePresets = q
                    ? presets.filter(p => String(p).toLowerCase().includes(q))
                    : presets;

                const selected = Array.isArray(formData?.[group.selectedKey]) ? formData[group.selectedKey] : [];
                const selectedSet = new Set(selected);
                const selectedCount = presets.reduce((acc, p) => acc + (selectedSet.has(p) ? 1 : 0), 0);
                const noteValue = String(formData?.[group.noteKey] || '');

                return (
                    <div key={group.key} style={{ marginBottom: '0.9rem' }}>
                        <div className="choice-group-head">
                            <div className="choice-group-title">
                                {group.title}
                                <span className="choice-group-count">({selectedCount}/{presets.length})</span>
                            </div>
                            {presets.length > 0 && (
                                <div className="choice-group-actions">
                                    <button
                                        type="button"
                                        className="btn btn-compact"
                                        onClick={() => handleSelectAll(group.selectedKey, presets)}
                                    >
                                        Chọn tất cả
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-compact"
                                        onClick={() => handleClearAll(group.selectedKey)}
                                        disabled={selected.length === 0}
                                    >
                                        Bỏ chọn
                                    </button>
                                </div>
                            )}
                        </div>

                        {presets.length > 0 && (
                            <div className="choice-filter-row">
                                <input
                                    type="search"
                                    className="choice-filter"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(group.key, e.target.value)}
                                    placeholder={`Tìm trong ${group.title.toLowerCase()}...`}
                                />
                                {q && (
                                    <button
                                        type="button"
                                        className="btn btn-compact"
                                        onClick={() => setFilterValue(group.key, '')}
                                    >
                                        Xóa lọc
                                    </button>
                                )}
                            </div>
                        )}

                        {presets.length > 0 && visiblePresets.length === 0 && q && (
                            <div className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                                Không tìm thấy preset phù hợp.
                            </div>
                        )}

                        {presets.length > 0 && (
                            <div className="choice-grid" style={{ marginBottom: '0.6rem' }}>
                                {visiblePresets.map(p => (
                                    <label
                                        key={p}
                                        className={`choice-chip ${selectedSet.has(p) ? 'is-selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSet.has(p)}
                                            onChange={() => handleTogglePreset(group.selectedKey, p)}
                                        />
                                        <span>{p}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <textarea
                            name={group.noteKey}
                            value={noteValue}
                            onChange={handleTextChange}
                            rows={2}
                            placeholder="Bổ sung thêm..."
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default CLSDeNghiSection;
