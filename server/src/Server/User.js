const insertUserQuery = `
  INSERT INTO users (name, email, password)
  VALUES (?, ?, ?)
`;

const user = {
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  password: 'mật khẩu bảo mật'
};

connection.query(insertUserQuery, [user.name, user.email, user.password], (err, result) => {
  if (err) {
    console.error('Lỗi khi thêm người dùng:', err.message);
  } else {
    console.log('Người dùng đã được thêm thành công');
  }
});
