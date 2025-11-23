import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import '../styles/AttendancePage.css';

// Map trạng thái API sang giao diện
const statusColors = {
  Di_lam: '#4CAF50',
  Nghi_phep: '#2196F3',
  Nghi_khong_phep: '#F44336',
  Lam_them: '#673AB7',
  Di_tre: '#FF9800',
  Chua_cham_cong: '#B0BEC5',
};

const statusLabels = {
  Di_lam: 'Đi làm',
  Nghi_phep: 'Nghỉ phép',
  Nghi_khong_phep: 'Nghỉ KP',
  Lam_them: 'Tăng ca',
  Di_tre: 'Đi trễ',
  Chua_cham_cong: '',
};

const frontendToApiStatus = {
  'Đi làm': 'Di_lam',
  'Nghỉ phép': 'Nghi_phep',
  'Nghỉ KP': 'Nghi_khong_phep',
  'Tăng ca': 'Lam_them',
  'Đi trễ': 'Di_tre',
};

// Thứ trong tuần
const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const getWeekday = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return weekdayLabels[date.getDay()];
};

const isSunday = (year, month, day) => getWeekday(year, month, day) === 'CN';

// Hàm làm tròn về trăm đồng gần nhất
function roundToHundred(num) {
  return Math.round(num / 100) * 100;
}

const AttendancePage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [otHours, setOtHours] = useState(1);
  const [pendingChanges, setPendingChanges] = useState({});

  // State cho phần tính lương
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));
  const years = Array.from({ length: 10 }, (_, i) => ({
    value: 2023 + i,
    label: `${2023 + i}`,
  }));

  const daysInMonth = new Date(year, month, 0).getDate();

  // Lấy dữ liệu chấm công theo tháng/năm
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/attendance_admin/monthly?month=${month}&year=${year}`
        );
        setEmployees(res.data);
        if (res.data.length > 0) setSelectedEmployee(res.data[0]);
        setPendingChanges({});
      } catch (err) {
        setEmployees([]);
        setSelectedEmployee(null);
        setPendingChanges({});
      }
    };
    fetchData();
  }, [month, year]);

  // Tạo mảng các dòng, mỗi dòng 10 ngày
  const getDayRows = () => {
    const rows = [];
    for (let i = 0; i < daysInMonth; i += 10) {
      rows.push(Array.from({ length: Math.min(10, daysInMonth - i) }, (_, j) => i + j + 1));
    }
    return rows;
  };

  // Xử lý click vào ngày để lưu thay đổi tạm thời
  const handleDayClick = (day) => {
    // Không cho chỉnh vào Chủ nhật
    if (isSunday(year, month, day)) return;
    if (!selectedEmployee || !selectedStatus) return;
    const apiStatus = frontendToApiStatus[selectedStatus];
    const ngay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setPendingChanges((prev) => ({
      ...prev,
      [ngay]: {
        trang_thai: apiStatus,
        ghi_chu: selectedStatus === 'Tăng ca' ? `Tăng ca ${otHours} giờ` : '',
      },
    }));
  };

  // Gửi toàn bộ thay đổi tạm thời lên server khi nhấn nút Lưu
  const handleSaveChanges = async () => {
    if (!selectedEmployee || Object.keys(pendingChanges).length === 0) {
      alert('Không có thay đổi để lưu!');
      return;
    }

    try {
      const updates = Object.entries(pendingChanges).map(([ngay, data]) => ({
        MaTK: selectedEmployee.MaNV,
        ngay,
        trang_thai: data.trang_thai,
        ghi_chu: data.ghi_chu,
      }));

      await Promise.all(
        updates.map((update) =>
          axios.put('http://localhost:5000/api/attendance_admin/update', update)
        )
      );

      // Reload dữ liệu sau khi lưu
      const res = await axios.get(
        `http://localhost:5000/api/attendance_admin/monthly?month=${month}&year=${year}`
      );
      setEmployees(res.data);
      const found = res.data.find((nv) => nv.MaNV === selectedEmployee.MaNV);
      if (found) setSelectedEmployee(found);
      setPendingChanges({});
      alert('Lưu chấm công thành công!');
    } catch (err) {
      alert('Lưu chấm công thất bại!');
    }
  };

  // Hàm gọi API tính lương
  const fetchSalary = async () => {
    if (!selectedEmployee) return;
    setLoadingSalary(true);
    setSalaryInfo(null);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/salary/monthly?month=${month}&year=${year}`
      );
      const info = res.data.find((s) => s.MaNV === selectedEmployee.MaNV);
      setSalaryInfo(info || null);
    } catch (err) {
      setSalaryInfo(null);
    }
    setLoadingSalary(false);
  };

  // Xử lý nhập phụ cấp
  const handlePhuCapChange = (e) => {
    const value = Number(e.target.value) || 0;
    setSalaryInfo((prev) => ({
      ...prev,
      phu_cap: value
    }));
  };

  // Tính lại tổng lương khi phụ cấp thay đổi (và làm tròn về trăm đồng)
  const getTongLuong = () => {
    if (!salaryInfo) return 0;
    const tong =
      (salaryInfo.luong_co_ban || 0) +
      (salaryInfo.phu_cap || 0) +
      (salaryInfo.thuong || 0) -
      (salaryInfo.phat || 0);
    return roundToHundred(tong);
  };

  // Xác nhận chi trả lương
  const handlePaySalary = async () => {
    try {
      const tong_luong = getTongLuong();
      await axios.put('http://localhost:5000/api/salary/update', {
        MaNV: salaryInfo.MaNV,
        thang: month,
        nam: year,
        luong_co_ban: salaryInfo.luong_co_ban,
        phu_cap: salaryInfo.phu_cap,
        thuong: salaryInfo.thuong,
        phat: salaryInfo.phat,
        tong_luong,
        trang_thai: 'Da_tra'
      });
      setSalaryInfo((prev) => ({
        ...prev,
        tong_luong,
        trang_thai: 'Da_tra'
      }));
      alert('Đã xác nhận chi trả lương cho tài khoản này!');
    } catch (err) {
      alert('Cập nhật trạng thái lương thất bại!');
    }
  };

  // Tạo HTML phiếu lương theo mẫu yêu cầu (dùng để xuất PDF)
  const generatePayslipHtml = (info) => {
    const tong = getTongLuong();
    const formatted = (v) => (Number(v || 0)).toLocaleString();
    const title = `LƯƠNG THÁNG ${month}/${year} CỦA ${info.MaNV || info.MaTK || ''}`;

    // Return a fragment (no <html>/<head>/<body>) so html2pdf can render the element correctly
    return `
      <style>
        .payslip-container { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color:#222; }
        .payslip-box { width: 800px; margin: 20px auto; background:#fff; border-radius:8px; overflow:hidden }
        .payslip-header { background:#1976d2; color:#fff; padding:14px 20px; font-weight:700; font-size:18px }
        .payslip-row { display:flex; padding:14px 20px; align-items:center; border-bottom:1px solid #eef0f2 }
        .payslip-label { flex:1; color:#546e7a; font-size:16px }
        .payslip-value { width:240px; text-align:right; font-weight:600; font-size:16px }
        .muted { color:#666 }
        .total-row { background:#f5f7fa; }
        .total-left { color:#1976d2; font-weight:700; font-size:18px }
        .total-right { color:#1976d2; font-weight:700; font-size:18px; text-align:right }
        .status { padding:12px 20px }
      </style>
      <div class="payslip-container">
        <div class="payslip-box">
          <div class="payslip-header">${title}</div>
          <div class="payslip-row"><div class="payslip-label">Số ngày làm</div><div class="payslip-value">${info.soNgayLam || 0}</div></div>
          <div class="payslip-row"><div class="payslip-label">Số giờ tăng ca</div><div class="payslip-value">${info.soGioTangCa || 0}</div></div>
          <div class="payslip-row"><div class="payslip-label">Số ngày nghỉ không phép</div><div class="payslip-value">${info.soNgayNghiKhongPhep || 0}</div></div>
          <div class="payslip-row"><div class="payslip-label">Số ngày đi trễ</div><div class="payslip-value">${info.soNgayDiTre || 0}</div></div>
          <div class="payslip-row"><div class="payslip-label">Lương cơ bản</div><div class="payslip-value">${formatted(info.luong_co_ban)} đ</div></div>
          <div class="payslip-row"><div class="payslip-label">Phụ cấp</div><div class="payslip-value">${formatted(info.phu_cap)} đ</div></div>
          <div class="payslip-row"><div class="payslip-label">Thưởng</div><div class="payslip-value">${formatted(info.thuong)} đ</div></div>
          <div class="payslip-row"><div class="payslip-label">Phạt</div><div class="payslip-value">${formatted(info.phat)} đ</div></div>
          <div class="payslip-row total-row"><div class="total-left">Tổng lương</div><div class="total-right">${formatted(tong)} đ</div></div>
          <div class="status">Trạng thái: <span class="muted">${info.trang_thai === 'Da_tra' ? 'Đã chi trả' : 'Chưa chi trả'}</span></div>
          <div style="padding:18px 20px 30px 20px;">
            <div style="margin-bottom:18px; text-align:center; font-weight:600;">Xác nhận nhận tiền của admin</div>
            <div style="display:flex; justify-content:space-between; gap:40px; margin-top:24px;">
              <div style="flex:1; text-align:center">
                <div style="border-top:1px solid #999; padding-top:8px;">Người nhận</div>
              </div>
              <div style="flex:1; text-align:center">
                <div style="border-top:1px solid #999; padding-top:8px;">Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };


  // Tải PDF phiếu lương về máy
  // Tải PDF phiếu lương về máy (dùng html2canvas + jsPDF giống `statistical.js`)
  const handleDownloadPayslipPdf = async (info) => {
    if (!info) return;
    let container = null;
    try {
      const html = generatePayslipHtml(info);
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '820px';
      container.style.zIndex = '10000';
      // keep visible so html2canvas can render
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.background = '#fff';
      container.innerHTML = html;
      document.body.appendChild(container);

      console.log('Payslip container appended for PDF generation', container);
      console.log('Payslip container innerHTML length:', container.innerHTML.length);

      // dynamic import of html2canvas (same pattern as statistical.js)
      const hc = await import('html2canvas');
      const html2canvas = hc.default || hc;

      // Allow render
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgProps = doc.getImageProperties(imgData);
      const imgHeight = (imgProps.height * usableWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', margin, 10, usableWidth, imgHeight);

      const filename = `Phieu_luong_${info.MaNV || info.MaTK || 'NV'}_${month}_${year}.pdf`;
      doc.save(filename);
      console.log('PDF saved:', filename);
    } catch (err) {
      console.error('Failed to generate PDF (html2canvas/jsPDF)', err);
      alert('Tạo PDF thất bại. Hãy thử lại hoặc cài `html2canvas` (npm i html2canvas) nếu cần.');
    } finally {
      try { if (container) document.body.removeChild(container); } catch (e) {}
    }
  };

  return (
    <div className="thongke-page">
      <div className="thongke-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>
          <i className="fas fa-calendar-check"></i> Chấm công
        </h1>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group">
            <label>Tháng:</label>
            <Select
              options={months}
              value={months.find((m) => m.value === month)}
              onChange={(v) => setMonth(v.value)}
              placeholder="Chọn tháng"
              styles={{ 
                control: (base) => ({ ...base, minHeight: 32 }),
                menu: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
            <label>Năm:</label>
            <Select
              options={years}
              value={years.find((y) => y.value === year)}
              onChange={(v) => setYear(v.value)}
              placeholder="Chọn năm"
              styles={{ 
                control: (base) => ({ ...base, minHeight: 32 }),
                menu: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
        </div>

        <div className="thongke-table" style={{ display: 'flex', gap: 24 }}>
          {/* Danh sách nhân viên */}
          <div style={{ minWidth: 260 }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Nhân viên</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((nv, idx) => {
                  const days = nv.days || {};
                  // số ngày làm việc trong tháng (không tính Chủ nhật)
                  const requiredWorkdays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
                    (d) => getWeekday(year, month, d) !== 'CN'
                  ).length;
                  // đếm số ngày đã được chấm (không tính Chủ nhật)
                  let chamCongCount = 0;
                  for (let d = 1; d <= daysInMonth; d++) {
                    if (getWeekday(year, month, d) === 'CN') continue;
                    const dayInfo = days[d];
                    const status = dayInfo?.trang_thai || 'Chua_cham_cong';
                    if (status && status !== 'Chua_cham_cong') chamCongCount++;
                  }
                  const done = chamCongCount >= requiredWorkdays;
                  return (
                    <tr
                      key={nv.MaNV}
                      style={{
                        background: selectedEmployee && selectedEmployee.MaNV === nv.MaNV ? '#e3f2fd' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedEmployee(nv);
                        setPendingChanges({});
                        setSalaryInfo(null); // Reset form tính lương khi chọn nhân viên khác
                      }}
                    >
                      <td>{idx + 1}</td>
                      <td>{nv.TenNV}</td>
                      <td style={{ color: done ? '#4CAF50' : '#F44336' }}>
                        {done ? 'Đã chấm công' : 'Chưa chấm công'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lịch chấm công chi tiết + Form tính lương */}
          <div style={{ flex: '1 1 auto', minWidth: 600 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              {selectedEmployee ? `${selectedEmployee.MaNV} - ${selectedEmployee.TenNV}` : ''}
            </div>
            <table style={{ width: '100%', marginBottom: 16 }}>
              <tbody>
                {getDayRows().map((row, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    {/* Dòng tiêu đề thứ */}
                    <tr>
                      {row.map((day) => (
                        <td
                          key={`weekday-${day}`}
                          style={{
                            background: '#e3e3e3',
                            color: '#1976d2',
                            fontWeight: 'bold',
                            fontSize: 13,
                            padding: 4,
                            borderBottom: 'none'
                          }}
                        >
                          {getWeekday(year, month, day)}
                        </td>
                      ))}
                      {row.length < 10 &&
                        Array.from({ length: 10 - row.length }).map((_, i) => (
                          <td key={`weekday-empty-${i}`} style={{ background: '#f5f5f5', borderBottom: 'none' }} />
                        ))}
                    </tr>
                    {/* Dòng ngày và trạng thái */}
                    <tr>
                      {row.map((day) => {
                        const ngay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        // Nếu là Chủ nhật -> hiển thị là ngày nghỉ và không cho click
                        if (isSunday(year, month, day)) {
                          return (
                            <td
                              key={day}
                              style={{
                                background: '#eceff1',
                                color: '#1976d2',
                                whiteSpace: 'pre-line',
                                cursor: 'default',
                                minWidth: 55,
                                maxWidth: 80,
                                fontSize: 16,
                                padding: 10,
                              }}
                            >
                              <div style={{ fontWeight: 'bold' }}>{day}</div>
                              <div>Nghỉ CN</div>
                            </td>
                          );
                        }

                        const dayData = pendingChanges[ngay] || (selectedEmployee?.days ? selectedEmployee.days[day] : {});
                        const apiStatus = dayData?.trang_thai || 'Chua_cham_cong';
                        let cellText = statusLabels[apiStatus] || '';
                        if (apiStatus === 'Lam_them' && dayData?.ghi_chu) {
                          cellText = `Tăng ca\n${dayData.ghi_chu.replace('Tăng ca ', '')}`;
                        }
                        return (
                          <td
                            key={day}
                            style={{
                              background: statusColors[apiStatus],
                              color: '#fff',
                              whiteSpace: 'pre-line',
                              cursor: 'pointer',
                              minWidth: 55,
                              maxWidth: 80,
                              fontSize: 16,
                              padding: 10,
                            }}
                            onClick={() => handleDayClick(day)}
                          >
                            <div style={{ fontWeight: 'bold' }}>{day}</div>
                            <div>{cellText}</div>
                          </td>
                        );
                      })}
                      {row.length < 10 &&
                        Array.from({ length: 10 - row.length }).map((_, i) => (
                          <td key={`empty-${i}`} style={{ background: '#f5f5f5' }} />
                        ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {/* Các nút trạng thái và nút Lưu */}
            <div className="status-buttons" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedStatus('Đi làm')}
                  style={{ background: selectedStatus === 'Đi làm' ? '#4CAF50' : '#fff' }}
                >
                  Đi làm
                </button>
                <button
                  onClick={() => setSelectedStatus('Nghỉ phép')}
                  style={{ background: selectedStatus === 'Nghỉ phép' ? '#2196F3' : '#fff' }}
                >
                  Nghỉ phép
                </button>
                <button
                  onClick={() => setSelectedStatus('Nghỉ KP')}
                  style={{ background: selectedStatus === 'Nghỉ KP' ? '#F44336' : '#fff' }}
                >
                  Nghỉ KP
                </button>
                <button
                  onClick={() => setSelectedStatus('Đi trễ')}
                  style={{ background: selectedStatus === 'Đi trễ' ? '#FF9800' : '#fff' }}
                >
                  Đi trễ
                </button>
                <button
                  onClick={() => setSelectedStatus('Tăng ca')}
                  style={{ background: selectedStatus === 'Tăng ca' ? '#673AB7' : '#fff' }}
                >
                  Tăng ca
                </button>
              </div>
              <button
                className="save-btn"
                onClick={handleSaveChanges}
                style={{ background: '#28a745', color: '#fff', fontWeight: 'bold' }}
                disabled={Object.keys(pendingChanges).length === 0}
              >
                Lưu
              </button>
            </div>
            {/* Chọn giờ tăng ca nếu chọn Tăng ca */}
            {selectedStatus === 'Tăng ca' && (
              <div style={{ marginBottom: 8 }}>
                Giờ tăng ca:
                {[1, 2, 3, 4].map((h) => (
                  <label key={h} style={{ marginLeft: 8 }}>
                    <input
                      type="radio"
                      name="otHours"
                      checked={otHours === h}
                      onChange={() => setOtHours(h)}
                    />
                    {h} Giờ
                  </label>
                ))}
              </div>
            )}

            {/* Form tính lương */}
            <div style={{ marginTop: 24 }}>
              <button
                className="salary-btn"
                onClick={fetchSalary}
                style={{ background: '#1976d2', color: '#fff', fontWeight: 'bold', marginBottom: 8 }}
                disabled={!selectedEmployee}
              >
                Tính lương tháng này
              </button>
              {loadingSalary && <div>Đang tính lương...</div>}
              {salaryInfo && (
                <div>
                  <table className="salary-info-table">
                    <tbody>
                      <tr>
                        <th colSpan={2}>Lương tháng {month}/{year} của {salaryInfo.TenNV}</th>
                      </tr>
                      <tr>
                        <td>Số ngày làm</td>
                        <td>{salaryInfo.soNgayLam}</td>
                      </tr>
                      <tr>
                        <td>Số giờ tăng ca</td>
                        <td>{salaryInfo.soGioTangCa}</td>
                      </tr>
                      <tr>
                        <td>Số ngày nghỉ không phép</td>
                        <td>{salaryInfo.soNgayNghiKhongPhep}</td>
                      </tr>
                      <tr>
                        <td>Số ngày đi trễ</td>
                        <td>{salaryInfo.soNgayDiTre}</td>
                      </tr>
                      <tr>
                        <td>Lương cơ bản</td>
                        <td>{salaryInfo.luong_co_ban?.toLocaleString()} đ</td>
                      </tr>
                      <tr>
                        <td>
                          Phụ cấp
                          {salaryInfo.trang_thai !== 'Da_tra' && (
                            <input
                              type="number"
                              value={salaryInfo.phu_cap}
                              min={0}
                              style={{ width: 100, marginLeft: 8 }}
                              onChange={handlePhuCapChange}
                            />
                          )}
                        </td>
                        <td>{salaryInfo.phu_cap?.toLocaleString()} đ</td>
                      </tr>
                      <tr>
                        <td>Thưởng</td>
                        <td>{salaryInfo.thuong?.toLocaleString()} đ</td>
                      </tr>
                      <tr>
                        <td>Phạt</td>
                        <td>{salaryInfo.phat?.toLocaleString()} đ</td>
                      </tr>
                      <tr>
                        <td className="salary-total">Tổng lương</td>
                        <td className="salary-total">{getTongLuong().toLocaleString()} đ</td>
                      </tr>
                      <tr>
                        <td>Trạng thái</td>
                        <td className="salary-status">{salaryInfo.trang_thai === 'Da_tra' ? 'Đã chi trả' : 'Chưa chi trả'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Nút cập nhật trạng thái đã chi trả */}
                  {salaryInfo.trang_thai !== 'Da_tra' && (
                    <button
                      style={{
                        marginTop: 12,
                        background: '#388e3c',
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '8px 18px',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                      onClick={handlePaySalary}
                    >
                      Xác nhận chi trả lương
                    </button>
                  )}
                  {/* Nút in phiếu lương (luôn cho in khi có salaryInfo) */}
                  {/* In phiếu lương đã được loại bỏ; chỉ giữ nút Tải PDF dưới mẫu mới */}
                  <button
                    style={{
                      marginTop: 12,
                      marginLeft: 12,
                      background: '#6a1b9a',
                      color: '#fff',
                      fontWeight: 'bold',
                      padding: '8px 18px',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleDownloadPayslipPdf(salaryInfo)}
                    disabled={!salaryInfo}
                  >
                    Tải PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;