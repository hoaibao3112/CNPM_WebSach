// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const defaultForm = {
//   TenKM: '',
//   MoTa: '',
//   NgayBatDau: '',
//   NgayKetThuc: '',
//   LoaiKM: '',
//   ChiTiet: {},
//   SanPhamApDung: [],
// };

// const DiscountManagement = () => {
//   const [promotions, setPromotions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [reload, setReload] = useState(false);
//   const [error, setError] = useState('');
//   const [search, setSearch] = useState('');
//   const [detail, setDetail] = useState(null);
//   const [detailLoading, setDetailLoading] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState(defaultForm);
//   const [formType, setFormType] = useState('add'); // add | edit
//   const [formError, setFormError] = useState('');
//   const [deleteId, setDeleteId] = useState(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   // Lấy danh sách khuyến mãi
//   useEffect(() => {
//     setLoading(true);
//     axios
//       .get(`http://localhost:5000/api/khuyenmai?search=${encodeURIComponent(search)}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//         },
//       })
//       .then((res) => {
//         setPromotions(res.data.data || []);
//         setLoading(false);
//       })
//       .catch(() => {
//         setError('Không thể tải danh sách khuyến mãi');
//         setLoading(false);
//       });
//   }, [reload, search]);

//   // Xem chi tiết
//   const handleShowDetail = async (id) => {
//     setDetailLoading(true);
//     setDetail(null);
//     try {
//       const res = await axios.get(`http://localhost:5000/api/khuyenmai/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//         },
//       });
//       setDetail(res.data);
//     } catch {
//       setDetail({ error: 'Không thể tải chi tiết khuyến mãi' });
//     }
//     setDetailLoading(false);
//   };

//   // Đóng chi tiết
//   const handleCloseDetail = () => setDetail(null);

//   // Hiện form thêm/sửa
//   const handleShowForm = (type, data) => {
//     setFormType(type);
//     setFormError('');
//     if (type === 'edit' && data) {
//       setForm({
//         TenKM: data.TenKM,
//         MoTa: data.MoTa,
//         NgayBatDau: data.NgayBatDau?.slice(0, 10),
//         NgayKetThuc: data.NgayKetThuc?.slice(0, 10),
//         LoaiKM: data.LoaiKM,
//         ChiTiet: data.chi_tiet || {},
//         SanPhamApDung: (data.san_pham_ap_dung || []).map(sp => sp.MaSP),
//         MaKM: data.MaKM,
//       });
//     } else {
//       setForm(defaultForm);
//     }
//     setShowForm(true);
//   };

//   // Đóng form
//   const handleCloseForm = () => setShowForm(false);

//   // Xử lý nhập liệu form
//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setForm(f => ({ ...f, [name]: value }));
//   };

//   // Xử lý nhập liệu chi tiết khuyến mãi
//   const handleChiTietChange = (e) => {
//     const { name, value } = e.target;
//     setForm(f => ({
//       ...f,
//       ChiTiet: { ...f.ChiTiet, [name]: value }
//     }));
//   };

//   // Thêm/sửa khuyến mãi
//   const handleSubmitForm = async (e) => {
//     e.preventDefault();
//     setFormError('');
//     try {
//       if (formType === 'add') {
//         await axios.post('http://localhost:5000/api/khuyenmai', form, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//           },
//         });
//       } else {
//         await axios.put(`http://localhost:5000/api/khuyenmai/${form.MaKM}`, form, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//           },
//         });
//       }
//       setShowForm(false);
//       setReload(r => !r);
//     } catch (err) {
//       setFormError(err.response?.data?.error || 'Lỗi khi lưu khuyến mãi');
//     }
//   };

//   // Xóa khuyến mãi
//   const handleDelete = async (id) => {
//     if (!window.confirm('Bạn chắc chắn muốn xóa khuyến mãi này?')) return;
//     setDeleteId(id);
//     setDeleteLoading(true);
//     try {
//       await axios.delete(`http://localhost:5000/api/khuyenmai/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//         },
//       });
//       setReload(r => !r);
//     } catch {
//       alert('Lỗi khi xóa khuyến mãi');
//     }
//     setDeleteId(null);
//     setDeleteLoading(false);
//   };

//   // Đổi trạng thái
//   const handleToggleStatus = async (id) => {
//     try {
//       await axios.patch(`http://localhost:5000/api/khuyenmai/${id}/toggle-status`, {}, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//         },
//       });
//       setReload(r => !r);
//     } catch {
//       alert('Lỗi khi đổi trạng thái!');
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Quản lý khuyến mãi</h2>
//       <div className="flex gap-2 mb-4">
//         <input
//           type="text"
//           placeholder="Tìm kiếm tên khuyến mãi..."
//           className="border px-2 py-1 rounded"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//         <button
//           className="bg-blue-600 text-white px-4 py-2 rounded"
//           onClick={() => handleShowForm('add')}
//         >
//           + Thêm khuyến mãi
//         </button>
//       </div>
//       {loading ? (
//         <div>Đang tải...</div>
//       ) : error ? (
//         <div className="text-red-500">{error}</div>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white border">
//             <thead>
//               <tr>
//                 <th className="border px-2 py-1">#</th>
//                 <th className="border px-2 py-1">Tên KM</th>
//                 <th className="border px-2 py-1">Loại KM</th>
//                 <th className="border px-2 py-1">Thời gian</th>
//                 <th className="border px-2 py-1">Trạng thái</th>
//                 <th className="border px-2 py-1">Thao tác</th>
//               </tr>
//             </thead>
//             <tbody>
//               {promotions.map((km, idx) => (
//                 <tr key={km.MaKM}>
//                   <td className="border px-2 py-1">{idx + 1}</td>
//                   <td className="border px-2 py-1">{km.TenKM}</td>
//                   <td className="border px-2 py-1">{km.LoaiKM}</td>
//                   <td className="border px-2 py-1">
//                     {km.NgayBatDau?.slice(0, 10)} - {km.NgayKetThuc?.slice(0, 10)}
//                   </td>
//                   <td className="border px-2 py-1">
//                     {km.TrangThai ? (
//                       <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Hoạt động</span>
//                     ) : (
//                       <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Ngừng</span>
//                     )}
//                   </td>
//                   <td className="border px-2 py-1 flex gap-2">
//                     {/* Xem chi tiết */}
//               <button
//   title="Xem chi tiết"
//   className="text-blue-600 hover:underline px-2 py-1"
//   onClick={() => handleShowDetail(km.MaKM)}
// >
//   Xem
// </button>
//                     {/* Sửa */}
//                     <button
//                       className="bg-yellow-400 px-2 py-1 rounded"
//                       onClick={() => handleShowForm('edit', km)}
//                     >
//                       <svg width="16" height="16" fill="currentColor"><path d="M12.146 3.854a.5.5 0 0 1 0-.708l.708-.708a.5.5 0 0 1 .708 0l1.292 1.292a.5.5 0 0 1 0 .708l-.708.708a.5.5 0 0 1-.708 0l-1.292-1.292zm-1.292 1.292l-7.5 7.5V14h1.354l7.5-7.5-1.354-1.354z"/></svg>
//                     </button>
//                     {/* Xóa */}
//                     <button
//                       className="bg-red-400 px-2 py-1 rounded"
//                       disabled={deleteLoading && deleteId === km.MaKM}
//                       onClick={() => handleDelete(km.MaKM)}
//                     >
//                       <svg width="16" height="16" fill="currentColor"><path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6zm3 .5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1z"/></svg>
//                     </button>
//                     {/* Đổi trạng thái */}
//                     <button
//                       className="bg-blue-500 text-white px-2 py-1 rounded"
//                       onClick={() => handleToggleStatus(km.MaKM)}
//                     >
//                       Đổi trạng thái
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {promotions.length === 0 && (
//                 <tr>
//                   <td colSpan={7} className="text-center py-4">Không có khuyến mãi nào</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Hiển thị chi tiết khuyến mãi */}
//       {detail && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative">
//             <button
//               className="absolute top-2 right-2 text-xl"
//               onClick={handleCloseDetail}
//             >
//               ×
//             </button>
//             {detailLoading ? (
//               <div>Đang tải chi tiết...</div>
//             ) : detail.error ? (
//               <div className="text-red-500">{detail.error}</div>
//             ) : (
//               <>
//                 <h3 className="text-xl font-bold mb-2">{detail.TenKM}</h3>
//                 <div><b>Mô tả:</b> {detail.MoTa}</div>
//                 <div><b>Loại:</b> {detail.LoaiKM}</div>
//                 <div><b>Ngày bắt đầu:</b> {detail.NgayBatDau?.slice(0, 10)}</div>
//                 <div><b>Ngày kết thúc:</b> {detail.NgayKetThuc?.slice(0, 10)}</div>
//                 <div><b>Trạng thái:</b> {detail.TrangThai ? 'Đang hoạt động' : 'Ngừng'}</div>
//                 <div className="mt-2">
//                   <b>Chi tiết:</b>
//                   <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(detail.chi_tiet, null, 2)}</pre>
//                 </div>
//                 <div className="mt-2">
//                   <b>Sản phẩm áp dụng:</b>
//                   <ul>
//                     {(detail.san_pham_ap_dung || []).map((sp) => (
//                       <li key={sp.MaSP}>{sp.TenSP}</li>
//                     ))}
//                   </ul>
//                 </div>
//                 {detail.san_pham_tang && (
//                   <div className="mt-2">
//                     <b>Sản phẩm tặng:</b> {detail.san_pham_tang.TenSP}
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Form thêm/sửa khuyến mãi */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//           <form
//             className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative"
//             onSubmit={handleSubmitForm}
//           >
//             <button
//               className="absolute top-2 right-2 text-xl"
//               type="button"
//               onClick={handleCloseForm}
//             >
//               ×
//             </button>
//             <h3 className="text-xl font-bold mb-4">{formType === 'add' ? 'Thêm khuyến mãi' : 'Sửa khuyến mãi'}</h3>
//             {formError && <div className="text-red-500 mb-2">{formError}</div>}
//             <div className="mb-2">
//               <label className="block">Tên khuyến mãi</label>
//               <input
//                 type="text"
//                 name="TenKM"
//                 className="border px-2 py-1 rounded w-full"
//                 value={form.TenKM}
//                 onChange={handleFormChange}
//                 required
//               />
//             </div>
//             <div className="mb-2">
//               <label className="block">Mô tả</label>
//               <textarea
//                 name="MoTa"
//                 className="border px-2 py-1 rounded w-full"
//                 value={form.MoTa}
//                 onChange={handleFormChange}
//               />
//             </div>
//             <div className="mb-2 flex gap-2">
//               <div className="flex-1">
//                 <label className="block">Ngày bắt đầu</label>
//                 <input
//                   type="date"
//                   name="NgayBatDau"
//                   className="border px-2 py-1 rounded w-full"
//                   value={form.NgayBatDau}
//                   onChange={handleFormChange}
//                   required
//                 />
//               </div>
//               <div className="flex-1">
//                 <label className="block">Ngày kết thúc</label>
//                 <input
//                   type="date"
//                   name="NgayKetThuc"
//                   className="border px-2 py-1 rounded w-full"
//                   value={form.NgayKetThuc}
//                   onChange={handleFormChange}
//                   required
//                 />
//               </div>
//             </div>
//             <div className="mb-2">
//               <label className="block">Loại khuyến mãi</label>
//               <select
//                 name="LoaiKM"
//                 className="border px-2 py-1 rounded w-full"
//                 value={form.LoaiKM}
//                 onChange={handleFormChange}
//                 required
//               >
//                 <option value="">--Chọn loại--</option>
//                 <option value="giam_phan_tram">Giảm %</option>
//                 <option value="giam_tien_mat">Giảm tiền</option>
//                 <option value="mua_x_tang_y">Mua X tặng Y</option>
//                 <option value="qua_tang">Quà tặng</option>
//                 <option value="combo">Combo</option>
//               </select>
//             </div>
//             {/* Các trường chi tiết khuyến mãi */}
//             <div className="mb-2">
//               <label className="block">Chi tiết khuyến mãi</label>
//               <input
//                 type="number"
//                 name="PhanTramGiam"
//                 placeholder="Phần trăm giảm (%)"
//                 className="border px-2 py-1 rounded w-full mb-1"
//                 value={form.ChiTiet.PhanTramGiam || ''}
//                 onChange={handleChiTietChange}
//               />
//               <input
//                 type="number"
//                 name="SoTienGiam"
//                 placeholder="Số tiền giảm"
//                 className="border px-2 py-1 rounded w-full mb-1"
//                 value={form.ChiTiet.SoTienGiam || ''}
//                 onChange={handleChiTietChange}
//               />
//               <input
//                 type="number"
//                 name="GiaTriDonToiThieu"
//                 placeholder="Giá trị đơn tối thiểu"
//                 className="border px-2 py-1 rounded w-full mb-1"
//                 value={form.ChiTiet.GiaTriDonToiThieu || ''}
//                 onChange={handleChiTietChange}
//               />
//               <input
//                 type="number"
//                 name="GiamToiDa"
//                 placeholder="Giảm tối đa"
//                 className="border px-2 py-1 rounded w-full mb-1"
//                 value={form.ChiTiet.GiamToiDa || ''}
//                 onChange={handleChiTietChange}
//               />
//               <input
//                 type="number"
//                 name="SoLuongMua"
//                 placeholder="Số lượng mua"
//                 className="border px-2 py-1 rounded w-full mb-1"
//                 value={form.ChiTiet.SoLuongMua || ''}
//                 onChange={handleChiTietChange}
//               />
//               <input
//                 type="number"
//                 name="SoLuongTang"
//                 placeholder="Số lượng tặng"
//                 className="border px-2 py-1 rounded w-full mb-1"
//                 value={form.ChiTiet.SoLuongTang || ''}
//                 onChange={handleChiTietChange}
//               />
//               <input
//                 type="text"
//                 name="MaSPTang"
//                 placeholder="Mã sản phẩm tặng"
//                 className="border px-2 py-1 rounded w-full"
//                 value={form.ChiTiet.MaSPTang || ''}
//                 onChange={handleChiTietChange}
//               />
//             </div>
//             {/* Có thể bổ sung chọn sản phẩm áp dụng nếu muốn */}
//             <div className="mt-4 flex justify-end">
//               <button
//                 type="submit"
//                 className="bg-blue-600 text-white px-4 py-2 rounded"
//               >
//                 {formType === 'add' ? 'Thêm' : 'Cập nhật'}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DiscountManagement;