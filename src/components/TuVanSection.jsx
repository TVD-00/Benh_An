import React, { useCallback, useState } from 'react';
import { TU_VAN_PRESETS } from '../constants/options';

function toggleInArray(arr, value) {
    const cur = Array.isArray(arr) ? arr : [];
    return cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
}

const TuVanSection = ({ formData, setFormData, sendState }) => {
    const [filterText, setFilterText] = useState('');

    const selected = Array.isArray(formData?.tuVanPresets) ? formData.tuVanPresets : [];
    const selectedSet = new Set(selected);
    const tuVanText = String(formData?.tuVan || '');
    const tuVanInDocx = !!formData?.tuVanInDocx;

    const q = filterText.trim().toLowerCase();
    const visiblePresets = q
        ? TU_VAN_PRESETS.filter(p => String(p).toLowerCase().includes(q))
        : TU_VAN_PRESETS;

    const handleTogglePreset = useCallback((preset) => {
        setFormData(prev => {
            const next = { ...prev, tuVanPresets: toggleInArray(prev?.tuVanPresets, preset) };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleTextChange = useCallback((e) => {
        const value = e.target.value;
        setFormData(prev => {
            const next = { ...prev, tuVan: value };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleToggleInDocx = useCallback((e) => {
        const checked = e.target.checked;
        setFormData(prev => {
            const next = { ...prev, tuVanInDocx: checked };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleSelectAll = useCallback(() => {
        setFormData(prev => {
            const next = { ...prev, tuVanPresets: [...TU_VAN_PRESETS] };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    const handleClearAll = useCallback(() => {
        setFormData(prev => {
            const next = { ...prev, tuVanPresets: [] };
            if (sendState) sendState(next);
            return next;
        });
    }, [setFormData, sendState]);

    return (
        <div className="glass" style={{ padding: '1rem' }}>
            <label className={`choice-chip ${tuVanInDocx ? 'is-selected' : ''}`} style={{ marginBottom: '0.75rem' }}>
                <input type="checkbox" checked={tuVanInDocx} onChange={handleToggleInDocx} />
                <span>In mục Tư vấn trong DOCX</span>
            </label>

            <div className="choice-group-head" style={{ marginBottom: '0.6rem' }}>
                <div className="choice-group-title">
                    Preset tư vấn
                    <span className="choice-group-count">({selected.length}/{TU_VAN_PRESETS.length})</span>
                </div>
                <div className="choice-group-actions">
                    <button type="button" className="btn btn-compact" onClick={handleSelectAll}>
                        Chọn tất cả
                    </button>
                    <button type="button" className="btn btn-compact" onClick={handleClearAll} disabled={selected.length === 0}>
                        Bỏ chọn
                    </button>
                </div>
            </div>

            <div className="choice-filter-row">
                <input
                    type="search"
                    className="choice-filter"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Tìm preset tư vấn..."
                />
                {q && (
                    <button type="button" className="btn btn-compact" onClick={() => setFilterText('')}>
                        Xóa lọc
                    </button>
                )}
            </div>

            {visiblePresets.length === 0 && q && (
                <div className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Không tìm thấy preset phù hợp.
                </div>
            )}

            <div className="choice-grid" style={{ marginBottom: '0.75rem' }}>
                {visiblePresets.map(p => (
                    <label key={p} className={`choice-chip ${selectedSet.has(p) ? 'is-selected' : ''}`}>
                        <input
                            type="checkbox"
                            checked={selectedSet.has(p)}
                            onChange={() => handleTogglePreset(p)}
                        />
                        <span>{p}</span>
                    </label>
                ))}
            </div>

            <textarea
                name="tuVan"
                value={tuVanText}
                onChange={handleTextChange}
                rows={4}
                placeholder="Tư vấn thêm (tuỳ chỉnh theo bệnh nhân)..."
            />
        </div>
    );
};

export default TuVanSection;
