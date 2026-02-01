import React from 'react';

// Import các icon riêng lẻ từ thư mục icons
import downloadIcon from '../assets/icons/download.png';
import chatBubbleIcon from '../assets/icons/chat_bubble.png';
import syncIcon from '../assets/icons/sync.png';
import closeIcon from '../assets/icons/close.png';
import sendIcon from '../assets/icons/send.png';
import lockClosedIcon from '../assets/icons/lock_closed.png';
import lockOpenIcon from '../assets/icons/lock_open.png';
import pregnancyIcon from '../assets/icons/pregnancy.png';
import gynecologyIcon from '../assets/icons/gynecology.png';
import pediatricsIcon from '../assets/icons/pediatrics.png';
import stethoscopeIcon from '../assets/icons/stethoscope.png';
import checklistIcon from '../assets/icons/checklist.png';
import medicineIcon from '../assets/icons/medicine.png';
import chatIcon from '../assets/icons/chat.png';
import shareIcon from '../assets/icons/share.png';

// Mapping tên icon theo type và index (tương thích ngược với code cũ)
const ICON_MAP = {
    toolbar: [downloadIcon, chatBubbleIcon, syncIcon],
    misc: [closeIcon, sendIcon, lockClosedIcon, lockOpenIcon],
    specialty: [pregnancyIcon, gynecologyIcon, pediatricsIcon],
    clinical: [stethoscopeIcon, checklistIcon, medicineIcon],
    ui: [chatIcon, shareIcon]
};

// Mapping tên icon trực tiếp (cách dùng mới)
const ICONS_BY_NAME = {
    download: downloadIcon,
    chat_bubble: chatBubbleIcon,
    sync: syncIcon,
    close: closeIcon,
    send: sendIcon,
    lock_closed: lockClosedIcon,
    lock_open: lockOpenIcon,
    pregnancy: pregnancyIcon,
    gynecology: gynecologyIcon,
    pediatrics: pediatricsIcon,
    stethoscope: stethoscopeIcon,
    checklist: checklistIcon,
    medicine: medicineIcon,
    chat: chatIcon,
    share: shareIcon
};

/**
 * Component hiển thị icon
 * 
 * Cách dùng cũ (tương thích ngược):
 *   <SpriteIcon type="toolbar" idx={0} />
 * 
 * Cách dùng mới (khuyến nghị):
 *   <SpriteIcon name="download" />
 */
const SpriteIcon = ({
    type,           // 'toolbar' | 'misc' | 'specialty' | 'clinical' | 'ui' (cách cũ)
    idx,            // 0-based index (cách cũ)
    name,           // tên icon trực tiếp: 'download', 'chat', 'pregnancy'... (cách mới)
    total,          // không còn dùng, giữ để tương thích
    size = 20,
    className = '',
    alt = ''
}) => {
    let iconSrc = null;

    // Ưu tiên dùng name nếu có
    if (name && ICONS_BY_NAME[name]) {
        iconSrc = ICONS_BY_NAME[name];
    }
    // Fallback về cách cũ dùng type + idx
    else if (type && ICON_MAP[type] && idx !== undefined) {
        iconSrc = ICON_MAP[type][idx];
    }

    if (!iconSrc) {
        console.warn(`SpriteIcon: Không tìm thấy icon với name="${name}" hoặc type="${type}" idx="${idx}"`);
        return null;
    }

    return (
        <img
            src={iconSrc}
            alt={alt || name || `${type}-${idx}`}
            className={`sprite-icon ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                objectFit: 'contain',
                display: 'inline-block',
                verticalAlign: 'middle'
            }}
        />
    );
};

export default SpriteIcon;
