from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

# Định nghĩa mô hình cho bảng Images
class Image(Base):
    __tablename__ = 'images'  # Tên bảng sẽ là 'images'

    id = Column(Integer, primary_key=True, autoincrement=True)
    image = Column(String)

# Cấu hình kết nối tới cơ sở dữ liệu
DATABASE_URI = 'mysql+mysqlconnector://root:kimloan12345@localhost:3307/myweb1'
engine = create_engine(DATABASE_URI)

# Tạo bảng (Tương đương với câu lệnh "up" trong migration)
def upgrade():
    Base.metadata.create_all(engine)
    print("Table 'images' created successfully.")

# Xóa bảng (Tương đương với câu lệnh "down" trong migration)
def downgrade():
    Base.metadata.drop_all(engine)
    print("Table 'images' dropped successfully.")

if __name__ == '__main__':
    # Thực thi việc tạo bảng hoặc xóa bảng tùy vào nhu cầu
    upgrade()  # Gọi upgrade() để tạo bảng
    # downgrade()  # Gọi downgrade() nếu bạn muốn xóa bảng
