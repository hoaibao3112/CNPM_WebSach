import React, { useEffect, useState, useMemo } from 'react';
import '../styles/adminHome.css';

const ROLE_LABEL = {
  6: 'Quản trị viên',
  7: 'Quản lý kho',
  8: 'Nhân viên bán hàng',
  9: 'Quản lý nhân sự',
  10: 'Hỗ trợ kỹ thuật'
};

const getRoleLabel = (code) => {
  const n = typeof code === 'string' || typeof code === 'number' ? Number(code) : code;
  return ROLE_LABEL[n] || 'Nhân viên';
};

const initialsFromName = (name) => {
  if (!name) return 'NV';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const tryParseJSON = (raw) => {
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;
  const s = raw.trim();
  try {
    if (s.startsWith('{') || s.startsWith('[')) return JSON.parse(s);
  } catch { }
  try {
    const parsedOnce = JSON.parse(raw);
    if (typeof parsedOnce === 'string' && parsedOnce.trim().startsWith('{')) {
      return JSON.parse(parsedOnce);
    }
    return parsedOnce;
  } catch {
    return raw;
  }
};

const findFieldIgnoreCase = (obj = {}, candidates = []) => {
  if (!obj || typeof obj !== 'object') return undefined;
  const map = {};
  Object.keys(obj).forEach(k => { map[k.toLowerCase()] = obj[k]; });
  for (const name of candidates) {
    const v = map[name.toLowerCase()];
    if (v !== undefined) return v;
  }
  return undefined;
};

const loadUserFromLocalStorage = () => {
  const keys = ['userInfo', 'lotoget', 'user', 'authUser'];
  let parsed = null;
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    parsed = tryParseJSON(raw);
    if (parsed) return parsed;
  }
  return null;
};

const AdminHome = () => {
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('Quản trị viên');
  const [userRoleLabel, setUserRoleLabel] = useState('Quản trị viên');
  const [avatarText, setAvatarText] = useState('NV');

  // logo states
  const PUBLIC = process.env.PUBLIC_URL || '';
  const logoCandidates = useMemo(() => [
    '/img/logo/anhdong.gif',
    `${PUBLIC}/img/logo/anhdong.gif`,
    '/img/logo/animated.gif',
    `${PUBLIC}/img/logo/animated.gif`,
    '/img/logo/ChaoMung.jpg',
    `${PUBLIC}/img/logo/ChaoMung.jpg`,
    '/img/logo.png',
    `${PUBLIC}/img/logo.png`,
    '/img/logo.svg',
    `${PUBLIC}/img/logo.svg`
  ], [PUBLIC]);

  const [logoSrc, setLogoSrc] = useState(logoCandidates[0]);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // probe logo candidates (so animated gif is found if exists)
  useEffect(() => {
    let mounted = true;
    (async () => {
      for (let i = 0; i < logoCandidates.length; i++) {
        const url = logoCandidates[i];
        const ok = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
        if (!mounted) return;
        if (ok) {
          setLogoSrc(url);
          setShowLogo(true);
          return;
        }
      }
      if (mounted) setShowLogo(false);
    })();
    return () => { mounted = false; };
  }, [logoCandidates]); // run once plus when candidates change

  const handleLogoError = () => {
    const idx = logoCandidates.indexOf(logoSrc);
    if (idx >= 0 && idx < logoCandidates.length - 1) {
      setLogoSrc(logoCandidates[idx + 1]);
    } else {
      setShowLogo(false);
    }
  };

  useEffect(() => {
    try {
      const rawUser = loadUserFromLocalStorage();
      let src = rawUser;
      if (src && typeof src === 'object') {
        const nested = src.userInfo || src.user || src.data || src.Data;
        if (nested && typeof nested === 'object') src = nested;
      }

      const name = findFieldIgnoreCase(src, ['TenTK', 'HoTen', 'name', 'username', 'fullName', 'ten']) || 'Quản trị viên';
      const roleCode = findFieldIgnoreCase(src, ['MaQuyen', 'maQuyen', 'maquyen', 'role', 'roleId', 'permission', 'quyen']);

      setUserName(name);
      setAvatarText(initialsFromName(name));
      if (roleCode !== undefined && roleCode !== null && roleCode !== '') {
        setUserRoleLabel(getRoleLabel(roleCode));
      } else {
        setUserRoleLabel(String(name).toLowerCase().includes('admin') ? 'Quản trị viên' : 'Nhân viên');
      }
    } catch (e) {
      console.warn('AdminHome: load user failed', e);
      setUserName('Quản trị viên');
      setUserRoleLabel('Quản trị viên');
      setAvatarText('NV');
    }
  }, []);

  const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="admin-home">
      <div className="admin-left">
        <div className="card" style={{ padding: 16 }}>
          <div className="avatar">{avatarText}</div>
          <h3 style={{ marginTop: 6, marginBottom: 4 }}>{userName}</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{userRoleLabel}</p>
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid rgba(15,23,42,0.04)' }} />
        </div>
      </div>

      <div className="admin-right">
        <div className="hero">
          {showLogo && (
            <img
              src={logoSrc}
              alt="Logo"
              className="hero-image"
              onError={handleLogoError}
              aria-hidden={false}
            />
          )}

          <div className="hero-text">
            <h1 className="fade-in">Xin chào, {userName} 👋</h1>
            <div className="datetime" aria-live="polite">
              <span className="time" style={{ fontSize: 20 }}>{formatTime(now)}</span>
              <span className="date" style={{ marginLeft: 12, fontSize: 14 }}>{formatDate(now)}</span>
            </div>
            <p className="subtitle">
              Chào mừng bạn đã đến<br />
              Chúc bạn có một ngày làm việc hiệu quả!.
            </p>
            <div className="quick-actions">
              {/* thêm nút nếu cần */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
// ...existing code...