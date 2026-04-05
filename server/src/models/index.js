/**
 * Sequelize Models Index - ESM version
 * Load tất cả models và setup associations
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// --- Sequelize instance ---
const sequelize = new Sequelize(
  process.env.DB_NAME || 'qlbs',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+07:00',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,    // DB không đồng nhất timestamp columns
      freezeTableName: true  // Không tự thêm 's' vào tên bảng
    }
  }
);

// --- Import Models ---
import SanPhamModel from './SanPham.model.js';
import TheLoaiModel from './TheLoai.model.js';
import TacGiaModel from './TacGia.model.js';
import KhachHangModel from './KhachHang.model.js';
import TaiKhoanModel from './TaiKhoan.model.js';
import NhanVienModel from './NhanVien.model.js';
import NhaCungCapModel from './NhaCungCap.model.js';
import HoaDonModel from './HoaDon.model.js';
import ChiTietHoaDonModel from './ChiTietHoaDon.model.js';
import GioHangChiTietModel from './GioHangChiTiet.model.js';
import PhieuNhapModel from './PhieuNhap.model.js';
import ChiTietPhieuNhapModel from './ChiTietPhieuNhap.model.js';
import NhomQuyenModel from './NhomQuyen.model.js';
import ChucNangModel from './ChucNang.model.js';
import ChiTietQuyenModel from './ChiTietQuyen.model.js';
import KhuyenMaiModel from './KhuyenMai.model.js';
import CtKhuyenMaiModel from './CtKhuyenMai.model.js';
import PhieuGiamGiaModel from './PhieuGiamGia.model.js';
import PhieuGiamGiaPhathanhModel from './PhieuGiamGiaPhathanh.model.js';
import DiaChiModel from './DiaChi.model.js';
import BinhLuanModel from './BinhLuan.model.js';
import DanhGiaModel from './DanhGia.model.js';
import DanhGiaDonHangModel from './DanhGiaDonHang.model.js';
import ChatRoomModel from './ChatRoom.model.js';
import ChatMessageModel from './ChatMessage.model.js';
import ChamCongModel from './ChamCong.model.js';
import OtpRequestModel from './OtpRequest.model.js';
import FaqModel from './Faq.model.js';

// --- Init Models ---
const SanPham = SanPhamModel(sequelize);
const TheLoai = TheLoaiModel(sequelize);
const TacGia = TacGiaModel(sequelize);
const KhachHang = KhachHangModel(sequelize);
const TaiKhoan = TaiKhoanModel(sequelize);
const NhanVien = NhanVienModel(sequelize);
const NhaCungCap = NhaCungCapModel(sequelize);
const HoaDon = HoaDonModel(sequelize);
const ChiTietHoaDon = ChiTietHoaDonModel(sequelize);
const GioHangChiTiet = GioHangChiTietModel(sequelize);
const PhieuNhap = PhieuNhapModel(sequelize);
const ChiTietPhieuNhap = ChiTietPhieuNhapModel(sequelize);
const NhomQuyen = NhomQuyenModel(sequelize);
const ChucNang = ChucNangModel(sequelize);
const ChiTietQuyen = ChiTietQuyenModel(sequelize);
const KhuyenMai = KhuyenMaiModel(sequelize);
const CtKhuyenMai = CtKhuyenMaiModel(sequelize);
const PhieuGiamGia = PhieuGiamGiaModel(sequelize);
const PhieuGiamGiaPhathanh = PhieuGiamGiaPhathanhModel(sequelize);
const DiaChi = DiaChiModel(sequelize);
const BinhLuan = BinhLuanModel(sequelize);
const DanhGia = DanhGiaModel(sequelize);
const DanhGiaDonHang = DanhGiaDonHangModel(sequelize);
const ChatRoom = ChatRoomModel(sequelize);
const ChatMessage = ChatMessageModel(sequelize);
const ChamCong = ChamCongModel(sequelize);
const OtpRequest = OtpRequestModel(sequelize);
const Faq = FaqModel(sequelize);

// --- Associations ---

// SanPham <-> TheLoai, TacGia
SanPham.belongsTo(TheLoai, { foreignKey: 'MaTL', as: 'theLoai' });
SanPham.belongsTo(TacGia, { foreignKey: 'MaTG', as: 'tacGia' });
TheLoai.hasMany(SanPham, { foreignKey: 'MaTL', as: 'sanPhams' });
TacGia.hasMany(SanPham, { foreignKey: 'MaTG', as: 'sanPhams' });

// HoaDon <-> KhachHang, ChiTietHoaDon
HoaDon.belongsTo(KhachHang, { foreignKey: 'makh', as: 'khachHang' });
KhachHang.hasMany(HoaDon, { foreignKey: 'makh', as: 'hoaDons' });
HoaDon.hasMany(ChiTietHoaDon, { foreignKey: 'MaHD', as: 'chiTiets' });
ChiTietHoaDon.belongsTo(HoaDon, { foreignKey: 'MaHD', as: 'hoaDon' });
ChiTietHoaDon.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'sanPham' });

// GioHang
GioHangChiTiet.belongsTo(KhachHang, { foreignKey: 'MaKH', as: 'khachHang' });
GioHangChiTiet.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'sanPham' });
KhachHang.hasMany(GioHangChiTiet, { foreignKey: 'MaKH', as: 'gioHang' });

// PhieuNhap
PhieuNhap.hasMany(ChiTietPhieuNhap, { foreignKey: 'MaPN', as: 'chiTiets' });
ChiTietPhieuNhap.belongsTo(PhieuNhap, { foreignKey: 'MaPN', as: 'phieuNhap' });
ChiTietPhieuNhap.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'sanPham' });

// Phân quyền
NhomQuyen.hasMany(ChiTietQuyen, { foreignKey: 'MaQuyen', as: 'chiTietQuyens' });
ChiTietQuyen.belongsTo(NhomQuyen, { foreignKey: 'MaQuyen', as: 'nhomQuyen' });
ChiTietQuyen.belongsTo(ChucNang, { foreignKey: 'MaCN', as: 'chucNang' });
TaiKhoan.belongsTo(NhomQuyen, { foreignKey: 'MaQuyen', as: 'nhomQuyen' });

// Khuyến mãi
KhuyenMai.hasMany(CtKhuyenMai, { foreignKey: 'MaKM', as: 'chiTiets' });
CtKhuyenMai.belongsTo(KhuyenMai, { foreignKey: 'MaKM', as: 'khuyenMai' });
PhieuGiamGia.belongsTo(KhuyenMai, { foreignKey: 'MaKM', as: 'khuyenMai' });
PhieuGiamGiaPhathanh.belongsTo(PhieuGiamGia, { foreignKey: 'MaPhieu', as: 'phieuGiamGia' });
PhieuGiamGiaPhathanh.belongsTo(KhachHang, { foreignKey: 'makh', as: 'khachHang' });

// Địa chỉ
DiaChi.belongsTo(KhachHang, { foreignKey: 'MakH', as: 'khachHang' });
KhachHang.hasMany(DiaChi, { foreignKey: 'MakH', as: 'diaChis' });

// Bình luận, Đánh giá
BinhLuan.belongsTo(KhachHang, { foreignKey: 'makh', as: 'khachHang' });
BinhLuan.belongsTo(SanPham, { foreignKey: 'masp', as: 'sanPham' });
BinhLuan.hasMany(BinhLuan, { foreignKey: 'mabl_cha', as: 'replies' });

DanhGia.belongsTo(SanPham, { foreignKey: 'MaSP', as: 'sanPham' });
DanhGia.belongsTo(KhachHang, { foreignKey: 'MaKH', as: 'khachHang' });

DanhGiaDonHang.belongsTo(HoaDon, { foreignKey: 'MaHD', as: 'hoaDon' });
DanhGiaDonHang.belongsTo(KhachHang, { foreignKey: 'MaKH', as: 'khachHang' });

// Chat
ChatRoom.belongsTo(KhachHang, { foreignKey: 'customer_id', as: 'khachHang' });
ChatRoom.hasMany(ChatMessage, { foreignKey: 'room_id', as: 'messages' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });

// Chấm công
ChamCong.belongsTo(TaiKhoan, { foreignKey: 'MaTK', as: 'taiKhoan' });

// --- Export ---
const db = {
  sequelize,
  Sequelize,
  SanPham,
  TheLoai,
  TacGia,
  KhachHang,
  TaiKhoan,
  NhanVien,
  NhaCungCap,
  HoaDon,
  ChiTietHoaDon,
  GioHangChiTiet,
  PhieuNhap,
  ChiTietPhieuNhap,
  NhomQuyen,
  ChucNang,
  ChiTietQuyen,
  KhuyenMai,
  CtKhuyenMai,
  PhieuGiamGia,
  PhieuGiamGiaPhathanh,
  DiaChi,
  BinhLuan,
  DanhGia,
  DanhGiaDonHang,
  ChatRoom,
  ChatMessage,
  ChamCong,
  OtpRequest,
  Faq
};

export default db;
export {
  sequelize,
  SanPham,
  TheLoai,
  TacGia,
  KhachHang,
  TaiKhoan,
  NhanVien,
  NhaCungCap,
  HoaDon,
  ChiTietHoaDon,
  GioHangChiTiet,
  PhieuNhap,
  ChiTietPhieuNhap,
  NhomQuyen,
  ChucNang,
  ChiTietQuyen,
  KhuyenMai,
  CtKhuyenMai,
  PhieuGiamGia,
  PhieuGiamGiaPhathanh,
  DiaChi,
  BinhLuan,
  DanhGia,
  DanhGiaDonHang,
  ChatRoom,
  ChatMessage,
  ChamCong,
  OtpRequest,
  Faq
};