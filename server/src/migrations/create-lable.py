from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

# Định nghĩa mô hình cho bảng Lables
class Label(Base):
    __tablename__ = 'lables'  # Tên bảng sẽ là 'lables'

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String)
    value = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Cấu hình kết nối tới cơ sở dữ liệu
DATABASE_URI = 'mysql+mysqlconnector://root:kimloan12345@localhost:3307/myweb1'
engine = create_engine(DATABASE_URI)

# Tạo bảng (Tương đương với câu lệnh "up" trong migration)
def upgrade():
    Base.metadata.create_all(engine)
    print("Table 'lables' created successfully.")

# Xóa bảng (Tương đương với câu lệnh "down" trong migration)
def downgrade():
    Base.metadata.drop_all(engine)
    print("Table 'lables' dropped successfully.")

if __name__ == '__main__':
    # Thực thi việc tạo bảng hoặc xóa bảng tùy vào nhu cầu
    upgrade()  # Gọi upgrade() để tạo bảng
    # downgrade()  # Gọi downgrade() nếu bạn muốn xóa bảng
