import React, { useEffect, useState, useMemo } from 'react';
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined, 
  DashboardOutlined, 
  ShoppingOutlined, 
  UserAddOutlined, 
  RocketOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Card, Avatar, Tag, Statistic, Button, Divider } from 'antd';

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
    if (typeof parsedOnce === 'string' && parsedOnce.trim().startsWith('{')) return JSON.parse(parsedOnce);
    return parsedOnce;
  } catch { return raw; }
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

  const PUBLIC = process.env.PUBLIC_URL || '';
  const logoCandidates = useMemo(() => [
    '/img/logo/anhdong.gif',
    `${PUBLIC}/img/logo/anhdong.gif`,
    '/img/logo/ChaoMung.jpg',
    `${PUBLIC}/img/logo/ChaoMung.jpg`,
    '/img/logo.png',
    `${PUBLIC}/img/logo.png`
  ], [PUBLIC]);

  const [logoSrc, setLogoSrc] = useState(logoCandidates[0]);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
  }, [logoCandidates]);

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
      if (roleCode !== undefined && roleCode !== null && roleCode !== '') setUserRoleLabel(getRoleLabel(roleCode));
      else setUserRoleLabel(String(name).toLowerCase().includes('admin') ? 'Quản trị viên' : 'Nhân viên');
    } catch (e) {
      setUserName('Quản trị viên');
      setUserRoleLabel('Quản trị viên');
      setAvatarText('NV');
    }
  }, []);

  const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 md:p-10 min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 blur-3xl -z-10 rounded-full opacity-60"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:w-80 space-y-6">
            <Card className="rounded-[2.5rem] border-0 shadow-2xl shadow-slate-200/50 p-4 text-center group">
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] rotate-6 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-indigo-200"></div>
                <div className="absolute inset-0 bg-white rounded-[2.5rem] flex items-center justify-center text-3xl font-black text-indigo-600 border-2 border-indigo-50">
                  {avatarText}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{userName}</h3>
              <Tag className="px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest bg-indigo-50 text-indigo-600 border-0 mb-6">{userRoleLabel}</Tag>
              
              <Divider className="my-6 border-slate-100" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</span>
                  <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Trực tuyến
                  </div>
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phiên làm việc</span>
                  <span className="text-xs font-black text-slate-700">4h 12m</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <Statistic title={<span className="text-[9px] font-black text-slate-400 uppercase">Tin nhắn</span>} value={8} valueStyle={{ fontWeight: 900, fontSize: '20px' }} prefix={<RocketOutlined className="text-blue-500" />} />
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <Statistic title={<span className="text-[9px] font-black text-slate-400 uppercase">Thông báo</span>} value={14} valueStyle={{ fontWeight: 900, fontSize: '20px' }} prefix={<ThunderboltOutlined className="text-amber-500" />} />
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="relative z-10 flex flex-col xl:flex-row items-center gap-12">
                {showLogo && (
                  <div className="w-full xl:w-2/5 shrink-0 group-hover:scale-[1.02] transition-transform duration-700">
                    <img 
                      src={logoSrc} 
                      alt="Hero" 
                      className="w-full h-auto rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border-4 border-white"
                      onError={() => setShowLogo(false)}
                    />
                  </div>
                )}
                
                <div className="flex-1 text-center xl:text-left space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full">
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Dashboard V2.0</span>
                      <CheckCircleOutlined className="text-indigo-600" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-slate-800">
                      Chào ngày mới, <br />
                      <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                        {userName}
                      </span>
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4">
                    <div className="flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-[1.5rem] shadow-xl shadow-slate-200">
                      <ClockCircleOutlined className="text-indigo-400 text-xl" />
                      <span className="text-xl font-black tracking-tight">{formatTime(now)}</span>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                      <CalendarOutlined className="text-indigo-500 text-xl" />
                      <span className="text-base font-bold text-slate-600">{formatDate(now)}</span>
                    </div>
                  </div>

                  <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-lg">
                    Chào mừng bạn quay lại hệ thống quản trị. Hôm nay có <span className="text-slate-800 font-black">12 đơn hàng mới</span> đang chờ bạn xử lý. Chúc bạn một ngày làm việc hiệu quả!
                  </p>

                  <div className="pt-4 flex flex-wrap justify-center xl:justify-start gap-4">
                    <Button type="primary" size="large" icon={<DashboardOutlined />} className="h-14 px-10 rounded-2xl bg-indigo-600 border-0 shadow-lg shadow-indigo-100 font-black uppercase text-xs tracking-widest transform hover:-translate-y-1 transition-all">
                      Bắt đầu ngay
                    </Button>
                    <Button size="large" className="h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                      Xem báo cáo
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Doanh thu', val: '2,450,000đ', icon: <DollarOutlined />, color: 'bg-indigo-500', trend: '+12%' },
                { label: 'Đơn hàng', val: '12', icon: <ShoppingOutlined />, color: 'bg-purple-500', trend: '+5' },
                { label: 'Khách mới', val: '5', icon: <UserAddOutlined />, color: 'bg-emerald-500', trend: '+2' }
              ].map((stat, i) => (
                <Card key={i} className="rounded-[2.5rem] border-0 shadow-lg shadow-slate-200/30 group hover:-translate-y-2 transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl ${stat.color} flex items-center justify-center text-white text-2xl shadow-lg shadow-${stat.color.split('-')[1]}-100`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{stat.val}</span>
                        <span className="text-[10px] font-black text-emerald-500">{stat.trend}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}} />
    </div>
  );
};

export default AdminHome;